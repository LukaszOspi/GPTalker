/* eslint-disable react-hooks/exhaustive-deps */
import React, {useState, useEffect} from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  SafeAreaView,
  StyleSheet,
  Platform,
  StatusBar,
} from 'react-native';
import Voice from 'react-native-voice';
import axios from 'axios';
import Tts from 'react-native-tts';
import base64 from 'react-native-base64';

const OpenAI = require('openai');

const App = () => {
  const [isRecording, setIsRecording] = useState(false);
  const [transcription, setTranscription] = useState('');
  const [responseText, setResponseText] = useState('');


  useEffect(() => {
    Voice.onSpeechStart = onSpeechStart;
    Voice.onSpeechEnd = onSpeechEnd;
    Voice.onSpeechResults = onSpeechResults;
    Voice.onSpeechError = onSpeechError;
    Tts.setDefaultLanguage('en-GB');
    Tts.setDefaultVoice('en-GB');
  
  
    return () => {
      Voice.destroy().then(Voice.removeAllListeners);
    };
  }, []);
  
  const onSpeechError = (error) => {
    console.error('Speech error:', error);
    setIsRecording(false);
  };
  

  const onSpeechStart = () => {
    setIsRecording(true);
  };

  const onSpeechEnd = () => {
    setIsRecording(false);
  };

  const onSpeechResults = async event => {
    if (event.value && event.value.length > 0) {
      const text = event.value[0];
      console.log(`Transcription: ${text}`);
      setTranscription(text);
    } else {
      // Call the speechToText function with the provided audio file
      speechToText();
    }
  };
  
  
  

  const startRecording = async () => {
    try {
      await Voice.start('en-US');
    } catch (error) {
      console.error('Error starting Voice:', error);
    }
  };

  /*
  const stopRecording = async () => {
    try {
      await Voice.stop();
    } catch (error) {
      console.error('Error stopping Voice:', error);
    }
  };
*/
const stopRecording = async () => {
  try {
    await Voice.stop();
    // Send the transcription to GPT after stopping the recording
    onSendToGPT();
  } catch (error) {
    console.error('Error stopping Voice:', error);
  }
};

  const speechToText = async () => {
    const config = {
      encoding: 'FLAC',
      sampleRateHertz: 16000,
      languageCode: 'en-US',
    };
  
    const audio = {
      uri: 'gs://cloud-samples-tests/speech/brooklyn.flac',
    };
  
    const request = {
      config: config,
      audio: audio,
    };
  
    const url = `https://speech.googleapis.com/v1/speech:recognize?key=${apiKey}`;
  
    try {
      const response = await axios.post(url, request);
      const results = response.data.results;
      const transcription = results[0].alternatives[0].transcript;
      console.log(`Transcription: ${transcription}`);
      setTranscription(transcription);
    } catch (error) {
      console.error('Error:', error);
    }
  };
  

  const openaiURL = 'https://api.openai.com/v1/engines/text-davinci-002/completions';

const sendTextToChatGPT = async text => {
  try {
    const prompt = `User: ${text}\nAI:`;
    const response = await axios.post(
      openaiURL,
      {
        prompt: prompt,
        max_tokens: 150,
        n: 1,
        stop: null,
        temperature: 0.5,
      },
      {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${OpenAI.apiKey}`,
        },
      }
    );
    const chatGPTResponse = response.data.choices[0].text.trim();
    console.log('ChatGPT Response:', chatGPTResponse);
    return chatGPTResponse;
  } catch (error) {
    console.error('Error:', error);
  }
};


  const onSendToGPT = async () => {
    if (transcription) {
      const chatGPTResponse = await sendTextToChatGPT(transcription);
      setResponseText(chatGPTResponse);
      Tts.speak(chatGPTResponse);
    } else {
      console.log('Transcription is empty or null.');
    }
  };
  
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.innerContainer}>
        <Text style={styles.statusText}>{isRecording ? 'Recording...' : 'Tap to Record'}</Text>
        <TouchableOpacity
          onPressIn={startRecording}
          onPressOut={stopRecording}
          style={styles.recordButton}>
          <Text style={styles.buttonText}>Hold to Record</Text>
        </TouchableOpacity>
        <TouchableOpacity
  onPress={onSendToGPT}
  style={{
    backgroundColor: 'green',
    padding: 20,
    borderRadius: 10,
    marginTop: 20,
  }}>
  <Text style={{ color: 'white' }}>Send to GPT</Text>
</TouchableOpacity>
        <View style={styles.responseContainer}>
          <Text>Transcription: {transcription}</Text>
          <Text>ChatGPT Response: {responseText}</Text>
        </View>
      </View>
    </SafeAreaView>
  );
};

const statusBarHeight = Platform.OS === 'android' ? StatusBar.currentHeight : 0;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: statusBarHeight,
  },
  innerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  statusText: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  recordButton: {
    backgroundColor: 'blue',
    padding: 20,
    borderRadius: 10,
    marginTop: 20,
  },
  buttonText: {
    color: 'white',
  },
  responseContainer: {
    marginTop: 20,
  },
});


export default App;
