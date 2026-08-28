Add-Type -AssemblyName System.Drawing
$pngPath = "D:\khmer-caption-studio\app_icon.png"
$icoPath = "D:\khmer-caption-studio\app_icon.ico"

if (Test-Path $pngPath) {
    $img = [System.Drawing.Image]::FromFile($pngPath)
    $bmp = New-Object System.Drawing.Bitmap($img, 256, 256)
    $hIcon = $bmp.GetHicon()
    $icon = [System.Drawing.Icon]::FromHandle($hIcon)
    $stream = [System.IO.File]::Create($icoPath)
    $icon.Save($stream)
    $stream.Close()
    $img.Dispose()
    Write-Host "Successfully generated app_icon.ico!"
}
