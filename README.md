# GPTalker
is a project by Ospi.
Make chatGPT talk to you in different languages!

Set up a chatGPT key in file apiKeys.js as 
export const openAIAPIKey = 'your_key';

Run: 
npm install

For build : 
npx react-native start
npx react-native run-android

For creating an .apk:
Make sure you have the Android SDK and Android Studio installed on your computer.
Open the terminal in your project's root directory and run the following command to create a release build:
npx react-native run-android --variant=release

You will be able to find the .apk file here:
android/app/build/outputs/apk/release/app-release.apk
