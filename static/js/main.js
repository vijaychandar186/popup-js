document.addEventListener('DOMContentLoaded', () => {
    window.dismissNotification = () => document.getElementById('notification-bar').classList.add('hidden');

    const CONFIG = {
        FOCAL_LENGTH: 600,
        AVG_PUPIL_DISTANCE: 6.3,
        MIN_DISTANCE: 35,
        OPTIMAL_DISTANCE: 55,
        MAX_DISTANCE: 80,
        DISTANCE_SMOOTHING: 0.8,
        NOTIFICATION_COOLDOWN: 30000,
        BLINK_THRESHOLD: 0.015,
        BLINK_TIMEOUT: 20000,
        SCREEN_TIME_LIMIT: 1800000,
        BREAK_REMINDER: 1200000,
        BREATHING_REMINDER: 300000,
    };

    const featureToggles = {
        notifications: true,
        zoom: true,
        ambient: true,
        breathing: true,
        wellness: true,
        distance: true,
        blink: true,
        session: true,
        posture: true,
    };

    const state = {
        rawDistance: 60,
        smoothedDistance: 60,
        distanceBuffer: [],
        bufferSize: 10,
        lastNotifications: new Map(),
        lastBlinkTime: Date.now(),
        blinkCount: 0,
        eyeOpenState: true,
        startTime: Date.now(),
        lastBreakReminder: Date.now(),
        lastBreathingReminder: Date.now(),
        frameCount: 0,
        wellnessScore: 85,
        postureScore: 100,
        blinkScore: 100,
        distanceScore: 100,
        currentZoom: 1,
        targetZoom: 1,
        zoomDeadzone: 3,
        lastScoreUpdateTime: Date.now(),
    };

    const elements = {
        video: document.getElementById('video'),
        canvas: document.getElementById('canvas'),
        distanceStatus: document.getElementById('distance-status'),
        distanceValue: document.getElementById('distance-value'),
        distanceIndicator: document.getElementById('distance-indicator'),
        notificationBar: document.getElementById('notification-bar'),
        notificationTitle: document.getElementById('notification-title'),
        notificationText: document.getElementById('notification-text'),
        notificationIcon: document.getElementById('notification-icon'),
        breathingGuide: document.getElementById('breathing-guide'),
        breathingCircle: document.getElementById('breathing-circle'),
        errorMessage: document.getElementById('error-message'),
        loadingSpinner: document.getElementById('loading-spinner'),
        blinkCounter: document.getElementById('blink-counter'),
        sessionTime: document.getElementById('session-time'),
        postureStatus: document.getElementById('posture-status'),
        scoreValue: document.getElementById('score-value'),
        wellnessScore: document.getElementById('wellness-score'),
        ambientOverlay: document.getElementById('ambient-overlay'),
        settingsPanel: document.getElementById('settings-panel'),
        toggleSettings: document.getElementById('toggle-settings'),
        openSettings: document.getElementById('open-settings'),
        statsBar: document.getElementById('stats-bar'),
        blinkCounterContainer: document.getElementById('blink-counter-container'),
        sessionTimeContainer: document.getElementById('session-time-container'),
        postureStatusContainer: document.getElementById('posture-status-container'),
        targetDistance: document.getElementById('target-distance'),
        saveSettings: document.getElementById('save-settings'),
    };

    const ctx = elements.canvas.getContext('2d');

    const toggleElements = {
        notifications: document.getElementById('toggle-notifications'),
        zoom: document.getElementById('toggle-zoom'),
        ambient: document.getElementById('toggle-ambient'),
        breathing: document.getElementById('toggle-breathing'),
        wellness: document.getElementById('toggle-wellness'),
        distance: document.getElementById('toggle-distance'),
        blink: document.getElementById('toggle-blink'),
        session: document.getElementById('toggle-session'),
        posture: document.getElementById('toggle-posture'),
    };

    const configElements = {
        minDistance: document.getElementById('config-min-distance'),
        optimalDistance: document.getElementById('config-optimal-distance'),
        maxDistance: document.getElementById('config-max-distance'),
        notificationCooldown: document.getElementById('config-notification-cooldown'),
        blinkThreshold: document.getElementById('config-blink-threshold'),
        blinkTimeout: document.getElementById('config-blink-timeout'),
        screenTimeLimit: document.getElementById('config-screen-time-limit'),
        breakReminder: document.getElementById('config-break-reminder'),
        breathingReminder: document.getElementById('config-breathing-reminder'),
    };

    // Load settings from local storage
    const loadSettings = () => {
        const savedToggles = localStorage.getItem('featureToggles');
        if (savedToggles) {
            const parsedToggles = JSON.parse(savedToggles);
            Object.keys(featureToggles).forEach(key => {
                featureToggles[key] = parsedToggles[key] !== undefined ? parsedToggles[key] : featureToggles[key];
                toggleElements[key].checked = featureToggles[key];
            });
        }

        const savedConfig = localStorage.getItem('config');
        if (savedConfig) {
            const parsedConfig = JSON.parse(savedConfig);
            configElements.minDistance.value = parsedConfig.MIN_DISTANCE || CONFIG.MIN_DISTANCE;
            configElements.optimalDistance.value = parsedConfig.OPTIMAL_DISTANCE || CONFIG.OPTIMAL_DISTANCE;
            configElements.maxDistance.value = parsedConfig.MAX_DISTANCE || CONFIG.MAX_DISTANCE;
            configElements.notificationCooldown.value = (parsedConfig.NOTIFICATION_COOLDOWN / 1000) || (CONFIG.NOTIFICATION_COOLDOWN / 1000);
            configElements.blinkThreshold.value = parsedConfig.BLINK_THRESHOLD || CONFIG.BLINK_THRESHOLD;
            configElements.blinkTimeout.value = (parsedConfig.BLINK_TIMEOUT / 1000) || (CONFIG.BLINK_TIMEOUT / 1000);
            configElements.screenTimeLimit.value = (parsedConfig.SCREEN_TIME_LIMIT / 60000) || (CONFIG.SCREEN_TIME_LIMIT / 60000);
            configElements.breakReminder.value = (parsedConfig.BREAK_REMINDER / 60000) || (CONFIG.BREAK_REMINDER / 60000);
            configElements.breathingReminder.value = (parsedConfig.BREATHING_REMINDER / 60000) || (CONFIG.BREATHING_REMINDER / 60000);
        }
        updateConfig();
        updateFeatureVisibility();
    };

    // Save settings to local storage
    const saveSettings = () => {
        localStorage.setItem('featureToggles', JSON.stringify(featureToggles));
        localStorage.setItem('config', JSON.stringify({
            MIN_DISTANCE: CONFIG.MIN_DISTANCE,
            OPTIMAL_DISTANCE: CONFIG.OPTIMAL_DISTANCE,
            MAX_DISTANCE: CONFIG.MAX_DISTANCE,
            NOTIFICATION_COOLDOWN: CONFIG.NOTIFICATION_COOLDOWN,
            BLINK_THRESHOLD: CONFIG.BLINK_THRESHOLD,
            BLINK_TIMEOUT: CONFIG.BLINK_TIMEOUT,
            SCREEN_TIME_LIMIT: CONFIG.SCREEN_TIME_LIMIT,
            BREAK_REMINDER: CONFIG.BREAK_REMINDER,
            BREATHING_REMINDER: CONFIG.BREATHING_REMINDER,
        }));
        // Close settings panel after saving
        elements.settingsPanel.classList.remove('active');
        elements.openSettings.classList.remove('hidden');
    };

    // Event listeners for settings panel
    if (elements.openSettings && elements.toggleSettings && elements.settingsPanel && elements.saveSettings) {
        elements.openSettings.addEventListener('click', () => {
            elements.settingsPanel.classList.add('active');
            elements.openSettings.classList.add('hidden');
        });

        elements.toggleSettings.addEventListener('click', () => {
            elements.settingsPanel.classList.remove('active');
            elements.openSettings.classList.remove('hidden');
        });

        elements.saveSettings.addEventListener('click', () => {
            updateConfig();
            saveSettings();
        });
    } else {
        console.error('One or more elements not found:', {
            openSettings: !!elements.openSettings,
            toggleSettings: !!elements.toggleSettings,
            settingsPanel: !!elements.settingsPanel,
            saveSettings: !!elements.saveSettings,
        });
    }

    Object.keys(toggleElements).forEach(key => {
        toggleElements[key].addEventListener('change', () => {
            featureToggles[key] = toggleElements[key].checked;
            updateFeatureVisibility();
        });
    });

    const updateConfig = () => {
        CONFIG.MIN_DISTANCE = parseFloat(configElements.minDistance.value) || 35;
        CONFIG.OPTIMAL_DISTANCE = parseFloat(configElements.optimalDistance.value) || 55;
        CONFIG.MAX_DISTANCE = parseFloat(configElements.maxDistance.value) || 80;
        CONFIG.NOTIFICATION_COOLDOWN = (parseFloat(configElements.notificationCooldown.value) || 30) * 1000;
        CONFIG.BLINK_THRESHOLD = parseFloat(configElements.blinkThreshold.value) || 0.015;
        CONFIG.BLINK_TIMEOUT = (parseFloat(configElements.blinkTimeout.value) || 20) * 1000;
        CONFIG.SCREEN_TIME_LIMIT = (parseFloat(configElements.screenTimeLimit.value) || 30) * 60 * 1000;
        CONFIG.BREAK_REMINDER = (parseFloat(configElements.breakReminder.value) || 20) * 60 * 1000;
        CONFIG.BREATHING_REMINDER = (parseFloat(configElements.breathingReminder.value) || 5) * 60 * 1000;
        elements.targetDistance.textContent = CONFIG.OPTIMAL_DISTANCE;
    };

    const updateFeatureVisibility = () => {
        elements.notificationBar.classList.toggle('hidden', !featureToggles.notifications);
        elements.ambientOverlay.classList.toggle('hidden', !featureToggles.ambient);
        elements.breathingGuide.classList.toggle('hidden', !featureToggles.breathing);
        elements.distanceStatus.classList.toggle('hidden', !featureToggles.distance);
        elements.wellnessScore.classList.toggle('hidden', !featureToggles.wellness);
        elements.blinkCounterContainer.classList.toggle('hidden', !featureToggles.blink);
        elements.sessionTimeContainer.classList.toggle('hidden', !featureToggles.session);
        elements.postureStatusContainer.classList.toggle('hidden', !featureToggles.posture);
        elements.statsBar.classList.toggle('hidden', !featureToggles.wellness && !featureToggles.blink && !featureToggles.session && !featureToggles.posture);
        if (!featureToggles.zoom) document.body.style.transform = 'scale(1)';
    };

    const smoothValue = (newValue, oldValue, factor) => oldValue * factor + newValue * (1 - factor);

    const addToBuffer = value => {
        state.distanceBuffer.push(value);
        if (state.distanceBuffer.length > state.bufferSize) state.distanceBuffer.shift();
        const sorted = [...state.distanceBuffer].sort((a, b) => a - b);
        const mid = Math.floor(sorted.length / 2);
        return sorted.length % 2 === 0 ? (sorted[mid - 1] + sorted[mid]) / 2 : sorted[mid];
    };

    const canShowNotification = type => featureToggles.notifications && (Date.now() - (state.lastNotifications.get(type) || 0)) > CONFIG.NOTIFICATION_COOLDOWN;

    const showNotification = (type, icon, title, text) => {
        if (!canShowNotification(type)) return;
        state.lastNotifications.set(type, Date.now());
        elements.notificationIcon.innerHTML = icon;
        elements.notificationTitle.textContent = title;
        elements.notificationText.textContent = text;
        elements.notificationBar.classList.remove('hidden');
        elements.notificationBar.dataset.show = true;
        setTimeout(() => elements.notificationBar.classList.add('hidden'), 5000);
    };

    const calculateDistance = (p1, p2) => Math.sqrt((p2.x - p1.x) ** 2 + (p2.y - p1.y) ** 2);

    const updateZoom = () => {
        if (!featureToggles.zoom) return;
        const distance = state.smoothedDistance;
        if (distance < CONFIG.MIN_DISTANCE - state.zoomDeadzone) {
            state.targetZoom = Math.max(0.85, 1 - (CONFIG.MIN_DISTANCE - distance) * 0.01);
        } else if (distance > CONFIG.MAX_DISTANCE + state.zoomDeadzone) {
            state.targetZoom = Math.min(1.15, 1 + (distance - CONFIG.MAX_DISTANCE) * 0.005);
        } else {
            state.targetZoom = 1;
        }
        if (Math.abs(state.currentZoom - state.targetZoom) > 0.005) {
            state.currentZoom = smoothValue(state.targetZoom, state.currentZoom, 0.92);
            document.body.style.transform = `scale(${state.currentZoom})`;
            document.body.style.transformOrigin = 'center center';
        }
    };

    const updateAmbientEffects = () => {
        if (!featureToggles.ambient) return;
        const distance = state.smoothedDistance;
        const timeSinceLastBlink = Date.now() - state.lastBlinkTime;
        let opacity = '0';
        if (distance < CONFIG.MIN_DISTANCE || distance > CONFIG.MAX_DISTANCE || timeSinceLastBlink > 15000) {
            opacity = '0.05';
        }
        elements.ambientOverlay.style.opacity = opacity;
    };

    const triggerBreathingReminder = () => {
        if (!featureToggles.breathing) return;
        elements.breathingGuide.style.opacity = '1';
        elements.breathingCircle.style.transform = 'scale(1.5)';
        setTimeout(() => elements.breathingCircle.style.transform = 'scale(1)', 2000);
        setTimeout(() => elements.breathingGuide.style.opacity = '0', 8000);
    };

    const updateWellnessScores = () => {
        if (!featureToggles.wellness) return;
        const now = Date.now();
        const deltaTime = (now - state.lastScoreUpdateTime) / 1000;
        state.lastScoreUpdateTime = now;
        const alpha = deltaTime / 30;
        const distance = state.smoothedDistance;
        const timeSinceLastBlink = now - state.lastBlinkTime;
        const isOptimalDistance = distance >= CONFIG.OPTIMAL_DISTANCE - 10 && distance <= CONFIG.OPTIMAL_DISTANCE + 10;
        state.distanceScore = state.distanceScore * (1 - alpha) + (isOptimalDistance ? 100 : 0) * alpha;
        const isBlinkingRegularly = timeSinceLastBlink < CONFIG.BLINK_TIMEOUT;
        state.blinkScore = state.blinkScore * (1 - alpha) + (isBlinkingRegularly ? 100 : 0) * alpha;
        state.wellnessScore = Math.round((state.distanceScore + state.blinkScore) / 2);
    };

    const updateUI = () => {
        const distance = Math.round(state.smoothedDistance);
        const sessionMinutes = Math.floor((Date.now() - state.startTime) / 60000);
        const timeSinceLastBlink = Date.now() - state.lastBlinkTime;

        if (featureToggles.distance) {
            elements.distanceValue.textContent = distance;
            const isOutOfRange = distance < CONFIG.MIN_DISTANCE || distance > CONFIG.MAX_DISTANCE;

            // Update distance indicator - use fill for warning state
            if (isOutOfRange) {
                elements.distanceIndicator.className = 'w-12 h-12 bg-black border-2 border-black flex items-center justify-center';
                elements.distanceIndicator.querySelector('svg').classList.add('text-white');
            } else {
                elements.distanceIndicator.className = 'w-12 h-12 bg-white border-2 border-black flex items-center justify-center';
                elements.distanceIndicator.querySelector('svg').classList.remove('text-white');
            }
        }

        if (featureToggles.wellness) {
            // Update wellness score appearance
            if (state.wellnessScore >= 80) {
                elements.wellnessScore.className = 'flex items-center space-x-2 px-4 py-2 bg-black text-white';
            } else if (state.wellnessScore >= 60) {
                elements.wellnessScore.className = 'flex items-center space-x-2 px-4 py-2 bg-white border-2 border-black text-black';
            } else {
                elements.wellnessScore.className = 'flex items-center space-x-2 px-4 py-2 bg-gray-300 border-2 border-black text-black';
            }
            elements.scoreValue.textContent = state.wellnessScore;
        }

        elements.postureStatus.textContent = featureToggles.posture ? (distance >= CONFIG.OPTIMAL_DISTANCE - 10 && distance <= CONFIG.OPTIMAL_DISTANCE + 10 ? 'Excellent' : distance >= CONFIG.MIN_DISTANCE && distance <= CONFIG.MAX_DISTANCE ? 'Good' : 'Adjust') : 'No Face';
        if (featureToggles.blink) elements.blinkCounter.textContent = state.blinkCount;
        if (featureToggles.session) elements.sessionTime.textContent = `${sessionMinutes}m`;
        if (featureToggles.zoom) updateZoom();
        if (featureToggles.ambient) updateAmbientEffects();
    };

    const detectBlink = landmarks => {
        if (!featureToggles.blink && !featureToggles.wellness) return;
        const avgEyeHeight = (calculateDistance(landmarks[159], landmarks[23]) + calculateDistance(landmarks[386], landmarks[374])) / 2;
        const isBlinking = avgEyeHeight < CONFIG.BLINK_THRESHOLD;
        if (!isBlinking && state.eyeOpenState === false) {
            state.blinkCount++;
            state.lastBlinkTime = Date.now();
        }
        state.eyeOpenState = !isBlinking;
    };

    const checkForReminders = () => {
        if (!featureToggles.notifications && !featureToggles.breathing) return;
        const now = Date.now();
        const distance = state.smoothedDistance;
        const timeSinceLastBlink = now - state.lastBlinkTime;

        if (featureToggles.notifications) {
            if (distance < CONFIG.MIN_DISTANCE) {
                showNotification('distance', '<svg class="w-5 h-5 text-black" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"></path></svg>', 'Distance Alert', `You're at ${Math.round(distance)}cm. Move back slightly.`);
            } else if (distance > CONFIG.MAX_DISTANCE) {
                showNotification('distance', '<svg class="w-5 h-5 text-black" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"></path></svg>', 'Distance Alert', 'Move closer to reduce eye strain.');
            }

            if (timeSinceLastBlink > CONFIG.BLINK_TIMEOUT) {
                showNotification('blink', '<svg class="w-5 h-5 text-black" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>', 'Blink Reminder', 'Blink regularly to keep eyes comfortable.');
            }

            if (now - state.lastBreakReminder > CONFIG.BREAK_REMINDER) {
                showNotification('break', '<svg class="w-5 h-5 text-black" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 7.5 15.5 12.5l2.286 6.857L12 15.5 6.5 19.357 8.786 12.5 3 7.5l5.714 1.857L12 3z"></path></svg>', 'Break Reminder', 'Follow the 20-20-20 rule: Look 20 feet away for 20 seconds.');
                state.lastBreakReminder = now;
            }

            if (now - state.startTime > CONFIG.SCREEN_TIME_LIMIT) {
                showNotification('session', '<svg class="w-5 h-5 text-black" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>', 'Session Alert', 'Take a longer break after extended screen time.');
                state.startTime = now;
            }
        }

        if (featureToggles.breathing && now - state.lastBreathingReminder > CONFIG.BREATHING_REMINDER) {
            triggerBreathingReminder();
            state.lastBreathingReminder = now;
        }
    };

    const renderCanvas = landmarks => {
        ctx.clearRect(0, 0, elements.canvas.width, elements.canvas.height);
        ctx.drawImage(elements.video, 0, 0, elements.canvas.width, elements.canvas.height);
    };

    const onResults = results => {
        state.frameCount++;
        renderCanvas(results.multiFaceLandmarks?.[0]);
        if (!results.multiFaceLandmarks || results.multiFaceLandmarks.length === 0) {
            if (featureToggles.distance) elements.distanceValue.textContent = '--';
            if (featureToggles.posture) elements.postureStatus.textContent = 'No Face';
            return;
        }

        const landmarks = results.multiFaceLandmarks[0];
        const pixelDistance = calculateDistance(landmarks[145], landmarks[374]) * elements.canvas.width;
        state.smoothedDistance = smoothValue(addToBuffer((CONFIG.AVG_PUPIL_DISTANCE * CONFIG.FOCAL_LENGTH) / pixelDistance), state.smoothedDistance, CONFIG.DISTANCE_SMOOTHING);

        detectBlink(landmarks);
        if (featureToggles.wellness) updateWellnessScores();
        if (state.frameCount % 30 === 0) checkForReminders();
        updateUI();
    };

    const initApp = async () => {
        elements.canvas.width = 640;
        elements.canvas.height = 480;
        const faceMesh = new FaceMesh({ locateFile: file => `https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh@0.4/${file}` });
        faceMesh.setOptions({ maxNumFaces: 1, refineLandmarks: true, minDetectionConfidence: 0.7, minTrackingConfidence: 0.7 });
        faceMesh.onResults(onResults);

        try {
            const camera = new Camera(elements.video, { onFrame: async () => await faceMesh.send({ image: elements.video }), width: 640, height: 480 });
            elements.loadingSpinner.classList.remove('hidden');
            await camera.start();
            elements.loadingSpinner.classList.add('hidden');
            elements.canvas.classList.remove('hidden');
        } catch (err) {
            elements.loadingSpinner.classList.add('hidden');
            elements.errorMessage.classList.remove('hidden');
            elements.errorMessage.querySelector('p').textContent = 'Camera access failed. Ensure permissions are granted.';
            console.error('Camera error:', err);
        }
    };

    loadSettings();
    updateFeatureVisibility();
    updateConfig();
    initApp();
});
