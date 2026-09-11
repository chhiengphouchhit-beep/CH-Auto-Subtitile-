using System;
using System.Diagnostics;
using System.IO;
using System.Net;
using System.Threading;
using System.Windows.Forms;

namespace KhmerCaptionStudioLauncher
{
    static class Program
    {
        static bool CheckHealth(int timeoutMs)
        {
            try {
                HttpWebRequest req = (HttpWebRequest)WebRequest.Create("http://localhost:1100/api/health");
                req.Timeout = timeoutMs;
                using (WebResponse resp = req.GetResponse())
                using (StreamReader reader = new StreamReader(resp.GetResponseStream())) {
                    string res = reader.ReadToEnd();
                    return res != null && res.Contains("ok");
                }
            } catch {
                return false;
            }
        }

        [STAThread]
        static void Main()
        {
            try {
                string baseDir = AppDomain.CurrentDomain.BaseDirectory;
                string appDir = null;

                // 1. Resolve project directory (supports running from Desktop, root folder, or anywhere)
                if (File.Exists(Path.Combine(baseDir, "server.js"))) {
                    appDir = baseDir;
                } else if (File.Exists(@"D:\khmer-caption-studio\server.js")) {
                    appDir = @"D:\khmer-caption-studio";
                } else {
                    // Check parent directories
                    DirectoryInfo cur = new DirectoryInfo(baseDir);
                    while (cur != null && cur.Parent != null) {
                        cur = cur.Parent;
                        if (File.Exists(Path.Combine(cur.FullName, "khmer-caption-studio", "server.js"))) {
                            appDir = Path.Combine(cur.FullName, "khmer-caption-studio");
                            break;
                        }
                    }
                }

                if (string.IsNullOrEmpty(appDir) || !File.Exists(Path.Combine(appDir, "server.js"))) {
                    MessageBox.Show(
                        "រកមិនឃើញ Folder កម្មវិធី D:\\khmer-caption-studio ឡើយ!\nសូមប្រាកដថា Folder khmer-caption-studio នៅលើ Drive D: នៅដដែល។",
                        "Khmer Caption Studio",
                        MessageBoxButtons.OK,
                        MessageBoxIcon.Warning
                    );
                    return;
                }

                string serverFile = Path.Combine(appDir, "server.js");
                string nodeExe = Path.Combine(appDir, "bin", "node.exe");

                if (!File.Exists(nodeExe)) {
                    nodeExe = "node";
                }

                // 2. Check if server is already running on port 1100
                bool isRunning = CheckHealth(1500);

                // 3. Start server if not running
                if (!isRunning) {
                    ProcessStartInfo serverSi = new ProcessStartInfo();
                    serverSi.FileName = nodeExe;
                    serverSi.Arguments = "\"" + serverFile + "\"";
                    serverSi.WorkingDirectory = appDir;
                    serverSi.CreateNoWindow = true;
                    serverSi.UseShellExecute = false;
                    serverSi.WindowStyle = ProcessWindowStyle.Hidden;
                    Process.Start(serverSi);

                    // Wait for server to become healthy (up to 10 seconds)
                    for (int i = 0; i < 20; i++) {
                        Thread.Sleep(500);
                        if (CheckHealth(1000)) {
                            isRunning = true;
                            break;
                        }
                    }
                }

                // 4. Launch Desktop App Window (Edge App mode -> Chrome App mode -> Default Browser)
                string edgePath = @"C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe";
                if (!File.Exists(edgePath)) {
                    edgePath = @"C:\Program Files\Microsoft\Edge\Application\msedge.exe";
                }

                string chromePath = @"C:\Program Files\Google\Chrome\Application\chrome.exe";
                if (!File.Exists(chromePath)) {
                    chromePath = @"C:\Program Files (x86)\Google\Chrome\Application\chrome.exe";
                }

                ProcessStartInfo appSi = new ProcessStartInfo();
                if (File.Exists(edgePath)) {
                    appSi.FileName = edgePath;
                    appSi.Arguments = "--app=http://localhost:1100";
                } else if (File.Exists(chromePath)) {
                    appSi.FileName = chromePath;
                    appSi.Arguments = "--app=http://localhost:1100";
                } else {
                    appSi.FileName = "http://localhost:1100";
                    appSi.UseShellExecute = true;
                }
                Process.Start(appSi);

            } catch (Exception ex) {
                MessageBox.Show(
                    "Error launching Khmer Caption Studio: " + ex.Message,
                    "Khmer Caption Studio",
                    MessageBoxButtons.OK,
                    MessageBoxIcon.Error
                );
            }
        }
    }
}
