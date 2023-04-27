import {FFmpegKit, FFprobeKit, ReturnCode} from 'ffmpeg-kit-react-native';
import RNFS from 'react-native-fs';
import {ImageOrVideo} from 'react-native-image-crop-picker';

type CompressRun = {
  onError?: () => void;
  onProgress?: (progress: number) => void;
  onComplete?: (output: {
    sessionId: number;
    filename: string;
    sizeBefore: number;
    sizeAfter: number;
    outputPath: string;
  }) => void;
};

class Compress {
  public filename: string;
  public inputPath: string;
  public outputPath: string;

  constructor(file: ImageOrVideo) {
    this.filename = file.path.substring(file.path.lastIndexOf('/') + 1);
    this.inputPath = file.path;
    this.outputPath = this.getOutputPath(this.filename);
  }

  private getOutputPath(filename: string) {
    return `${RNFS.CachesDirectoryPath}/compressed_${filename}`;
  }

  private async getMediaInformation(path: string) {
    return FFprobeKit.getMediaInformation(path).then(session => {
      return session.getMediaInformation();
    });
  }

  private generateCommandScript() {
    const script = ['-i', this.inputPath];
    script.push('-c:v', 'libx264', '-crf', '28', '-preset', 'fast');
    script.push('-y', this.outputPath);
    return script;
  }

  public async run({onError, onProgress, onComplete}: CompressRun) {
    const information = await this.getMediaInformation(this.inputPath);
    const inputSize = Number(information.getSize());

    const ffmpegCommand = this.generateCommandScript();
    console.log(ffmpegCommand);

    FFmpegKit.executeWithArgumentsAsync(
      ffmpegCommand,
      async session => {
        const sessionId = session.getSessionId();
        const returnCode = await session.getReturnCode();

        if (returnCode.isValueError() && onError) {
          onError();
          return;
        }

        if (ReturnCode.isCancel(returnCode)) {
          console.log('Cancelled');
          return;
        }

        if (ReturnCode.isSuccess(returnCode)) {
          const exists = await RNFS.exists(this.outputPath);
          if (exists) {
            const outputInfo = await this.getMediaInformation(this.outputPath);
            const outputSize = Number(outputInfo.getSize());

            if (onComplete) {
              onComplete({
                sessionId,
                filename: this.filename,
                sizeBefore: inputSize,
                sizeAfter: outputSize,
                outputPath: this.outputPath,
              });
            }
          }
        }
      },
      log => {
        console.log(log.getMessage());
      },
      statistic => {
        const totalProgress = Math.round(
          (statistic.getTime() * 100) / information.getDuration() / 1000,
        );
        if (onProgress) {
          onProgress(totalProgress);
        }
      },
    );
  }
}

export default Compress;
