let recognition: SpeechRecognition | null = null;

export function startListening(): Promise<string> {
  return new Promise((resolve, reject) => {
    try {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      recognition = new SpeechRecognition();
      
      recognition.continuous = false;
      recognition.interimResults = false;
      
      recognition.onresult = (event) => {
        const transcript = event.results[0][0].transcript;
        resolve(transcript);
      };
      
      recognition.onerror = (event) => {
        reject(event.error);
      };
      
      recognition.start();
    } catch (error) {
      reject(error);
    }
  });
}

export function stopListening() {
  recognition?.stop();
  recognition = null;
}

// Type definitions for Web Speech API
declare global {
  const webkitSpeechRecognition: any;
  interface Window {
    SpeechRecognition: any;
    webkitSpeechRecognition: any;
  }
}
