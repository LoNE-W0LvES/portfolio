/*
# Extend portfolio_settings with full CV data

## Changes
Adds new columns to portfolio_settings for skills, education, projects (CV-based),
awards, languages, and digital skills. Also updates the single settings row with
real CV data for MD Nafiur Rahman.

## New Columns
- skills: jsonb array of {category, items[]}
- education: jsonb array of {degree, institution, period, location, url}
- cv_projects: jsonb array of {title, description, tags[]}
- awards: jsonb array of {year, title, org}
- languages: jsonb array of {name, levels{}}
- digital_skills: jsonb array of strings
- phone: text
- whatsapp: text
- nationality: text
- about_text: text (separate from bio)
*/

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='portfolio_settings' AND column_name='skills') THEN
    ALTER TABLE portfolio_settings ADD COLUMN skills jsonb NOT NULL DEFAULT '[]'::jsonb;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='portfolio_settings' AND column_name='education') THEN
    ALTER TABLE portfolio_settings ADD COLUMN education jsonb NOT NULL DEFAULT '[]'::jsonb;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='portfolio_settings' AND column_name='cv_projects') THEN
    ALTER TABLE portfolio_settings ADD COLUMN cv_projects jsonb NOT NULL DEFAULT '[]'::jsonb;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='portfolio_settings' AND column_name='awards') THEN
    ALTER TABLE portfolio_settings ADD COLUMN awards jsonb NOT NULL DEFAULT '[]'::jsonb;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='portfolio_settings' AND column_name='languages') THEN
    ALTER TABLE portfolio_settings ADD COLUMN languages jsonb NOT NULL DEFAULT '[]'::jsonb;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='portfolio_settings' AND column_name='digital_skills') THEN
    ALTER TABLE portfolio_settings ADD COLUMN digital_skills jsonb NOT NULL DEFAULT '[]'::jsonb;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='portfolio_settings' AND column_name='phone') THEN
    ALTER TABLE portfolio_settings ADD COLUMN phone text NOT NULL DEFAULT '';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='portfolio_settings' AND column_name='whatsapp') THEN
    ALTER TABLE portfolio_settings ADD COLUMN whatsapp text NOT NULL DEFAULT '';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='portfolio_settings' AND column_name='nationality') THEN
    ALTER TABLE portfolio_settings ADD COLUMN nationality text NOT NULL DEFAULT '';
  END IF;
END $$;

-- Seed real data
UPDATE portfolio_settings SET
  github_username = 'LoNE-W0LvES',
  display_name = 'MD Nafiur Rahman',
  title = 'CSE Student & IoT / Embedded Systems Developer',
  bio = 'I aim to use my programming knowledge and hardware skills to reduce import dependency and empower our country with locally developed technologies.',
  avatar_url = 'https://avatars.githubusercontent.com/u/LoNE-W0LvES?v=4',
  email = '170151.cse@student.just.edu.bd',
  location = 'Dhaka, Bangladesh',
  linkedin_url = 'https://www.linkedin.com/in/md-nafiur-rahman',
  nationality = 'Bangladeshi',
  phone = '+880 1521257588',
  whatsapp = '+8801521257588',
  sections_order = '["hero","about","skills","education","repos","cv_projects","awards","contact"]'::jsonb,
  sections_visible = '{"hero":true,"about":true,"skills":true,"education":true,"repos":true,"cv_projects":true,"awards":true,"contact":true}'::jsonb,
  theme = 'dark',
  accent_color = '#3b82f6',
  skills = '[
    {"category":"Microcontroller & IoT","items":["Arduino","ESP32/ESP8266","Raspberry Pi","Arduino IDE","MicroPython","LVGL"]},
    {"category":"Programming Languages","items":["Python","Java","Kotlin","JavaScript","C","C++","Lua","Arduino"]},
    {"category":"Web & Database","items":["HTML","CSS","React","PHP","MySQL","MongoDB"]},
    {"category":"PCB & Hardware","items":["Circuit Design","PCB Design","Fusion 360","Soldering"]},
    {"category":"Tools & IDEs","items":["VS Code","PyCharm","CLion","WebStorm","Android Studio","Adobe Photoshop","Octave"]}
  ]'::jsonb,
  education = '[
    {"degree":"B.Sc. in Computer Science and Engineering","institution":"Jashore University of Science and Technology","period":"Jan 2018 – Present","location":"Jashore, Bangladesh","url":"https://just.edu.bd","field":"Information and Communication Technologies"},
    {"degree":"Frontend Development with React","institution":"JUST – EDGE Digital Skills for Students","period":"Nov 2024 – Present","location":"Jashore, Bangladesh","url":"","field":""},
    {"degree":"Higher Secondary Certificate (HSC)","institution":"Dhaka City College","period":"2015 – 2017","location":"Dhaka, Bangladesh","url":"https://www.dhakacitycollege.edu.bd/","field":""},
    {"degree":"Secondary School Certificate (SSC)","institution":"New Model Multilateral High School","period":"2004 – 2015","location":"Dhaka, Bangladesh","url":"https://www.nmmhs.edu.bd/","field":""}
  ]'::jsonb,
  cv_projects = '[
    {"title":"Automatic Hand Sanitizer","description":"Detects hand presence, dispenses sanitizer, measures temperature via mlx90614 sensor and displays results. Built with Arduino, IR proximity sensor, Pump.","tags":["Arduino","IR Sensor","MLX90614","IoT"]},
    {"title":"Automatic Fish Feeder","description":"Uses ESP-32 S3, servo motor, and RTC clock to dispense food at intervals, with manual control via a phone app.","tags":["ESP32-S3","Servo","RTC","Android App"]},
    {"title":"Aquarium Management System","description":"ESP-32 S3 system to monitor water quality (pH, turbulence), control water/air pumps, with automatic and manual app control.","tags":["ESP32-S3","pH Sensor","IoT","Android App"]},
    {"title":"Fingerprint Door Lock with LVGL UI","description":"Capacitive fingerprint sensor with T-Display S3 MCU, LVGL-based UI, and Android app for remote control.","tags":["T-Display S3","LVGL","Fingerprint","Android App"]},
    {"title":"Face Recognition Door Lock","description":"ESP32-CAM facial recognition integrated with an Android app for remote door control.","tags":["ESP32-CAM","Face Recognition","Android App"]},
    {"title":"Web Automation Desktop App","description":"Data entry and scraping desktop application using Puppeteer (Node.js) and Pyppeteer (Python).","tags":["Python","Node.js","Puppeteer","Automation"]},
    {"title":"Smart Room Controller","description":"Remote/local control of lights, fan, and air conditioner via an Android app.","tags":["ESP32","Firebase","Android App","IoT"]},
    {"title":"Digital RGB Clock","description":"ESP32 + RTC module + 5050 RGB LEDs clock with NTP synchronization and dynamic lighting effects.","tags":["ESP32","RTC","NTP","RGB LED"]},
    {"title":"PC Power Mode Auto-Adjuster","description":"Python app to automatically switch PC power mode based on currently running program for optimal performance/efficiency.","tags":["Python","Automation","Windows"]},
    {"title":"PC Remote On/Off via Internet","description":"System using ESP32, relay, and Android app to power on/off a PC remotely over the internet.","tags":["ESP32","Relay","Android App","Remote"]},
    {"title":"Standalone QR Token Printer","description":"Prints QR data fetched from a server without requiring a PC or phone.","tags":["ESP32","QR Code","Standalone","Printer"]},
    {"title":"Standalone QR Scanner","description":"Scans and sends QR data to a server without needing a PC or phone.","tags":["ESP32","QR Code","Standalone"]},
    {"title":"Automatic Corridor Light System","description":"ESP32 + LDR + radar sensors to control corridor lighting based on ambient light and motion, saving energy.","tags":["ESP32","LDR","Radar","Automation"]}
  ]'::jsonb,
  awards = '[
    {"year":"2024","title":"1st Runner-up – INNOVATIVE IDEA 2023-2024","org":"E-Governance and Innovation Workplan Team, JUST"}
  ]'::jsonb,
  languages = '[
    {"name":"Bengali","level":"Native"},
    {"name":"English","level":"Proficient (C2 Listening, B2 Reading, C1 Writing)"},
    {"name":"Japanese","level":"Basic (B1 Listening, A1 Speaking)"}
  ]'::jsonb,
  digital_skills = '["Microsoft Word","Microsoft Excel","Microsoft PowerPoint","Google Drive","Google Docs","LinkedIn","Facebook"]'::jsonb,
  updated_at = now()
WHERE id = 1;
