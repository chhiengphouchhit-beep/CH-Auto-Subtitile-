using System;
using System.Diagnostics;
using System.IO;
using System.Threading;
using System.Windows.Forms;

namespace KhmerCaptionStudioLauncher
{
    static class Program
    {
        [STAThread]
        static void Main()
        {
            try {
                string baseDir = AppDomain.CurrentDomain.BaseDirectory;
                string batFile = Path.Combine(baseDir, "Start_Khmer_Caption_Studio.bat");
                string serverFile = Path.Combine(baseDir, "server.js");
                string nodeExe = Path.Combine(baseDir, "bin", "node.exe");

                if (!File.Exists(nodeExe)) {
                    nodeExe = "node";
                }

                // Check if server is already running on port 1100
                bool isRunning = false;
                try {
                    using (var client = new System.Net.WebClient()) {
                        string res = client.DownloadString("http://localhost:1100/api/health");
                        if (res.Contains("ok")) isRunning = true;
                    }
                } catch { }

                if (!isRunning && File.Exists(serverFile)) {
                    ProcessStartInfo serverSi = new ProcessStartInfo();
                    serverSi.FileName = nodeExe;
                    serverSi.Arguments = "\"" + serverFile + "\"";
                    serverSi.WorkingDirectory = baseDir;
                    serverSi.CreateNoWindow = true;
                    serverSi.UseShellExecute = false;
                    Process.Start(serverSi);
                    Thread.Sleep(2500);
                }

                // Launch Desktop App Window
                string edgePath = @"C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe";
                if (!File.Exists(edgePath)) {
                    edgePath = @"C:\Program Files\Microsoft\Edge\Application\msedge.exe";
                }

                ProcessStartInfo appSi = new ProcessStartInfo();
                if (File.Exists(edgePath)) {
                    appSi.FileName = edgePath;
                    appSi.Arguments = "--app=http://localhost:1100";
                } else {
                    appSi.FileName = "http://localhost:1100";
                    appSi.UseShellExecute = true;
                }
                Process.Start(appSi);

            } catch (Exception ex) {
                MessageBox.Show("Error launching Khmer Caption Studio: " + ex.Message, "Khmer Caption Studio", MessageBoxButtons.OK, MessageBoxIcon.Error);
            }
        }
    }
}
