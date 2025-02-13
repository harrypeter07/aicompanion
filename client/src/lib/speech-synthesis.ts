
export function speakText(text: string): void {
  if ('speechSynthesis' in window) {
    // Cancel any ongoing speech
    window.speechSynthesis.cancel();

    // Split text into sentences or chunks
    const chunks = text.match(/[^.!?]+[.!?]+/g) || [text];

    chunks.forEach((chunk, index) => {
      const utterance = new SpeechSynthesisUtterance(chunk);

      // Configure speech parameters
      utterance.rate = 1.0;
      utterance.pitch = 1.0;
      utterance.volume = 1.0;

      // Use a more natural voice if available
      const voices = window.speechSynthesis.getVoices();
      const englishVoice = voices.find(voice => 
        voice.lang.startsWith('en') && voice.name.includes('Google')
      );
      if (englishVoice) {
        utterance.voice = englishVoice;
      }

      // Add error handling
      utterance.onerror = (event) => {
        console.error('Speech synthesis error:', event);
      };

      // Queue the chunk with a slight delay between chunks
      setTimeout(() => {
        window.speechSynthesis.speak(utterance);
      }, index * 100);
    });
  } else {
    console.warn('Speech synthesis not supported in this browser');
  }
}

export function stopSpeaking(): void {
  if ('speechSynthesis' in window) {
    window.speechSynthesis.cancel();
  }
}
