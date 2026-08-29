import 'dart:io';

const windowsWebHost = 'appassets.shiguang';
const windowsWebOrigin = 'https://$windowsWebHost';

String windowsWebAssetRoot(String resolvedExecutable) => File(resolvedExecutable)
    .parent
    .uri
    .resolve('data/flutter_assets/assets/web/')
    .toFilePath(windows: true);
