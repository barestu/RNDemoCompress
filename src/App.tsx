/* eslint-disable react-native/no-inline-styles */
import React, {useState} from 'react';
import {
  Alert,
  Button,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import Video from 'react-native-video';
import ImageCropPicker, {ImageOrVideo} from 'react-native-image-crop-picker';
import Compress from './Compress';

type CompressEvent = {
  sessionId: number;
  filename: string;
  sizeBefore: number;
  sizeAfter: number;
  outputPath: string;
};

function App(): JSX.Element {
  const [compressEvents, setCompressEvents] = useState<CompressEvent[]>([]);
  const [progress, setProgress] = useState(0);
  const [videoUri, setVideoUri] = useState('');

  const toKb = (value?: number) => {
    return (value ? value / 1000 : 0) + ' kb';
  };

  const compressVideo = async (file: ImageOrVideo) => {
    const compress = new Compress(file);
    compress.run({
      onError: () => {
        setProgress(0);
      },
      onProgress: totalProgress => {
        setProgress(totalProgress);
      },
      onComplete: output => {
        setProgress(0);
        setCompressEvents([...compressEvents, output]);
      },
    });
  };

  const pickVideo = async () => {
    const file = await ImageCropPicker.openPicker({mediaType: 'video'});
    compressVideo(file);
  };

  const openCamera = async () => {
    const file = await ImageCropPicker.openCamera({mediaType: 'video'});
    compressVideo(file);
  };

  const openVideoPlayer = (path: string) => {
    setVideoUri(path);
  };

  const closeVideoPlayer = () => {
    setVideoUri('');
  };

  const downloadMedia = (path: string) => {
    Alert.alert(`Download this file ${path}`);
    // TODO: download functionality
  };

  if (videoUri) {
    return (
      <View style={{flex: 1, backgroundColor: 'black'}}>
        <Video
          source={{uri: videoUri}}
          resizeMode="contain"
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            bottom: 0,
            right: 0,
          }}
        />

        <View
          style={{
            position: 'absolute',
            bottom: 0,
            width: '100%',
            padding: 16,
            gap: 8,
          }}>
          <Button title="Download" onPress={() => downloadMedia(videoUri)} />
          <Button title="Close" color="grey" onPress={closeVideoPlayer} />
        </View>
      </View>
    );
  }

  return (
    <View style={{flex: 1}}>
      <ScrollView contentInsetAdjustmentBehavior="automatic">
        <View style={{paddingVertical: 16, paddingHorizontal: 16}}>
          <View style={{flex: 1, gap: 8, marginBottom: 16}}>
            <Button title="Select video" onPress={pickVideo} />
            <Button title="Open camera" onPress={openCamera} />
          </View>

          {compressEvents.map(ev => (
            <TouchableOpacity
              key={ev.sessionId}
              style={{
                flex: 1,
                borderWidth: 1,
                marginBottom: 2,
                padding: 4,
                borderColor: ev.sizeBefore > ev.sizeAfter ? 'green' : 'red',
              }}
              onPress={() => openVideoPlayer(ev.outputPath)}>
              <View>
                <Text style={{fontWeight: 'bold'}}>{ev.filename}</Text>
              </View>

              <View style={{flex: 1, flexDirection: 'row'}}>
                <View style={{flex: 1, padding: 4}}>
                  <Text>Before</Text>
                  <Text>Size: {toKb(ev.sizeBefore)}</Text>
                </View>

                <View style={{flex: 1, padding: 4}}>
                  <Text>After</Text>
                  <Text>Size: {toKb(ev.sizeAfter)}</Text>
                </View>
              </View>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>

      {Boolean(progress) && (
        <View style={{padding: 16, backgroundColor: '#d1d1d1'}}>
          <Text>Compressing {progress || 0}/100%</Text>
        </View>
      )}
    </View>
  );
}

export default App;
