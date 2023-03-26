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
const OpenAI = require('openai');

const apiKey = 'AIzaSyDCkqYv_W_g_v20UOqNWFuDjcWZiVorW7s'; // Replace with your API key
OpenAI.apiKey = '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'; // Replace with your OpenAI API key

const Speechapp = () => {
  const [isRecording, setIsRecording] = useState(false);
  const [transcription, setTranscription] = useState('');
  const [responseText, setResponseText] = useState('');

  useEffect(() => {
    Voice.onSpeechStart = onSpeechStart;
    Voice.onSpeechEnd = onSpeechEnd;
    Voice.onSpeechResults = onSpeechResults;

    return () => {
      Voice.destroy().then(Voice.removeAllListeners);
    };
  }, []);

  const onSpeechStart = () => {
    setIsRecording(true);
  };

  const onSpeechEnd = () => {
    setIsRecording(false);
  };

  const onSpeechResults = async event => {
    const audioBytes = event.value[0];
    const text = await speechToText(audioBytes);
    setTranscription(text);

    const chatGPTResponse = await sendTextToChatGPT(text);
    setResponseText(chatGPTResponse);

    Tts.speak(chatGPTResponse);
  };

  const startRecording = async () => {
    try {
      await Voice.start('en-US');
    } catch (error) {
      console.error('Error starting Voice:', error);
    }
  };

  const stopRecording = async () => {
    try {
      await Voice.stop();
    } catch (error) {
      console.error('Error stopping Voice:', error);
    }
  };

  const speechToText = async audioBytes => {
    const config = {
      encoding: 'LINEAR16',
      sampleRateHertz: 16000,
      languageCode: 'en-US',
    };

    const audio = {
      content: audioBytes,
    };

    const request = {
      config: config,
      audio: audio,
    };

    const url = `https://speech.googleapis.com/v1/speech:recognize?key=${apiKey}`;

    try {
      const response = await axios.post(url, request);
      const results = response.data.results;
      // eslint-disable-next-line no-shadow
      const transcription = results[0].alternatives[0].transcript;
      console.log(`Transcription: ${transcription}`);
      return transcription;
    } catch (error) {
      console.error('Error:', error);
    }
  };

  const sendTextToChatGPT = async text => {
    try {
      const prompt = `User: ${text}\nAI:`;
      const response = await OpenAI.Completion.create({
        engine: 'text-davinci-002', // Choose the engine you want to use
        prompt: prompt,
        max_tokens: 150,
        n: 1,
        stop: null,
        temperature: 0.5,
      });
      const chatGPTResponse = response.choices[0].text.trim();
      console.log('ChatGPT Response:', chatGPTResponse);
      return chatGPTResponse;
    } catch (error) {
      console.error('Error:', error);
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

export default Speechapp;
