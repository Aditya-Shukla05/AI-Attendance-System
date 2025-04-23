import cv2
import face_recognition
import numpy as np
import pickle
from attendance_tracker import mark_attendance
import sys
import os
from simple_facerec import SimpleFacerec  # Import SimpleFacerec class

# Initialize SimpleFacerec
sfr = SimpleFacerec()

# Load the known face encodings from the encodings file
ENCODINGS_FILE = "/home/adi/Programming/AI-Attendance-System/encodings.pickle"

if len(sys.argv) < 2:
    #print("No image given")
    sys.exit(1)

# Load the saved encodings
if not os.path.exists(ENCODINGS_FILE):
    #print(f"Encodings file '{ENCODINGS_FILE}' not found. Run 'encode_faces.py' first.")
    sys.exit(1)

# Load the encodings data
with open(ENCODINGS_FILE, "rb") as f:
    data = pickle.load(f)
    known_face_encodings = data["encodings"]
    known_face_names = data["names"]

# Load the known face encodings into SimpleFacerec
sfr.known_face_encodings = known_face_encodings
sfr.known_face_names = known_face_names

# Load and process the uploaded image
img_path = sys.argv[1]
image = face_recognition.load_image_file(img_path)
image_cv = cv2.imread(img_path)

# Detect faces and match them using SimpleFacerec
face_locations, face_names = sfr.detect_known_faces(image_cv)

if len(face_names) == 0:
    #print("No faces found in the uploaded image.")
    sys.exit(0)

# Mark attendance for recognized faces
for name in face_names:
    print(f"{name}")
    mark_attendance(name)