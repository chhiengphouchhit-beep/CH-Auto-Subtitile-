using System;
using System.Diagnostics;
using System.IO;
using System.Net.Sockets;
using System.Threading;
using System.Windows.Forms;

namespace KhmerCaptionStudioLauncher
{
    static class Program
    {
        static bool IsServerReady()
        {
            try {
                using (TcpClient tcp = new TcpClient()) {
                    IAsyncResult ar = tcp.BeginConnect("127.0.0.1", 1100, null, null);
                    bool ok = ar.AsyncWaitHandle.WaitOne(150);
                    if (!ok) return false;
                    tcp.EndConnect(ar);
                    return true;
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

                if (File.Exists(Path.Combine(baseDir, "server.js"))) {
                    appDir = baseDir;
                } else if (File.Exists(@"D:\khmer-caption-studio\server.js")) {
                    appDir = @"D:\khmer-caption-studio";
                }

                if (string.IsNullOrEmpty(appDir)) {
                    MessageBox.Show("រកមិនឃើញ Folder D:\\khmer-caption-studio ឡើយ!", "Khmer Caption Studio", MessageBoxButtons.OK, MessageBoxIcon.Warning);
                    return;
                }

                string serverFile = Path.Combine(appDir, "server.js");
                string nodeExe = Path.Combine(appDir, "bin", "node.exe");
                if (!File.Exists(nodeExe)) nodeExe = "node";

                // Fast check: Is server already listening? (Takes ~2ms)
                bool isRunning = IsServerReady();

                if (!isRunning) {
                    // Start server silently in background
                    ProcessStartInfo serverSi = new ProcessStartInfo {
                        FileName = nodeExe,
                        Arguments = "\"" + serverFile + "\"",
                        WorkingDirectory = appDir,
                        CreateNoWindow = true,
                        UseShellExecute = false,
                        WindowStyle = ProcessWindowStyle.Hidden
                    };
                    Process.Start(serverSi);

                    // Rapid check (polls every 100ms, ready in ~300ms)
                    for (int i = 0; i < 30; i++) {
                        Thread.Sleep(100);
                        if (IsServerReady()) break;
                    }
                }

                // Launch Desktop App Window immediately
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
                MessageBox.Show("Error: " + ex.Message, "Khmer Caption Studio", MessageBoxButtons.OK, MessageBoxIcon.Error);
            }
        }
    }
}
