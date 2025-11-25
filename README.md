# PopUp Wellness Monitor

**PopUp Wellness Monitor** is a web-based application that leverages AI-powered facial landmark detection to promote better digital health. It monitors eye strain, posture, and screen time by analyzing live webcam input. The system provides real-time feedback through notifications, animations, and visual overlays to help users maintain healthier screen habits.

---

## ✨ Features

* **Face Tracking**: Real-time facial landmark detection using MediaPipe FaceMesh.
* **Distance Monitoring**: Measures user's distance from the screen with configurable thresholds (min, optimal, max).
* **Blink Detection**: Tracks blink frequency to reduce eye strain.
* **Posture Feedback**: Infers posture from facial position and distance.
* **Wellness Score**: Calculates a dynamic score based on distance and blink frequency.
* **Breathing Reminders**: Periodic prompts for breathing exercises with animated visuals.
* **Ambient Effects**: Background color overlays reflect wellness state.
* **Zoom Adjustment**: Dynamically scales content based on user distance.
* **Customizable Settings**: Toggle features and fine-tune thresholds, timers, and sensitivity.
* **Responsive UI**: Modern design built with Tailwind CSS, accessible settings, and real-time stats.

---

## 🚀 Getting Started

1. **Clone the repository**:

```bash
git clone <repository-url>
cd wellness-monitor
```

2. **Start local server**:

```bash
python3 -m http.server 8000
```

3. **Open the app**:
   Visit `http://localhost:8000` in your web browser.

> **Note**: Webcam access is required. Grant camera permissions when prompted.

---

## 📊 Real-Time Feedback

* **Distance Status**: Top-left indicator shows current distance in cm with color codes:

  * Green: Optimal
  * Yellow: Near threshold
  * Red: Out of range

* **Notifications**: Timely alerts for:

  * Distance too close/far
  * Low blink rate
  * Break time reminders

* **Breathing Guide**: Calm animation appears based on configured interval.

* **Stats Bar**: Displays blink count, session duration, posture status, and wellness score.

* **Ambient Overlay**: Visual feedback that subtly encourages adjustments.

---

## ⚙️ Configuration Options

Accessible from the **Settings Panel** (top-right):

* **Toggle Features**:

  * Notifications
  * Zoom Adjustment
  * Ambient Effects
  * Breathing Prompts
  * Wellness Score
  * Blink/Posture/Distance Monitoring

* **Distance Settings**:

  * Minimum: 20-50 cm
  * Optimal: 40-70 cm
  * Maximum: 60-100 cm

* **Timing Controls**:

  * Notification Cooldown: 10-300 seconds
  * Break Reminders: 5-60 minutes
  * Breathing Prompts: 1-30 minutes

* **Detection Parameters**:

  * Blink Sensitivity: 0.005-0.05
  * Blink Timeout: 5-60 seconds
  * Session Limit: 10-120 minutes

---

## 📚 Dependencies

All dependencies are included via CDN in the HTML:

* [MediaPipe FaceMesh](https://google.github.io/mediapipe/solutions/face_mesh.html): Facial landmark detection.
* [MediaPipe Camera Utils](https://github.com/google/mediapipe): Camera input management.
* [Tailwind CSS](https://tailwindcss.com/): UI styling and layout.

---

## 📄 License

This project is licensed under the **MIT License**.

---

## 🙋 Contributing

Have an idea to improve the Wellness Monitor? Contributions are welcome! Feel free to fork the project and open a pull request.

---

## 🚨 Disclaimer

This app is for general wellness support and not a medical tool. Please consult a professional for medical advice.