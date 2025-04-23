import pandas as pd
from datetime import datetime

# Function to mark attendance
def mark_attendance(name):
    # Define the Excel file
    file_path = "attendance.xlsx"
    try:
        # Try to load existing data
        data = pd.read_excel(file_path)
    except FileNotFoundError:
        # If file doesn't exist, create a new DataFrame
        data = pd.DataFrame(columns=["Name", "Status", "Time"])

    # Check if the person is already marked present
    if name not in data['Name'].values:
        # Mark attendance
        now = datetime.now().strftime('%Y-%m-%d %H:%M:%S')
        new_entry = pd.DataFrame([[name, "Present", now]], columns=["Name", "Status", "Time"])
        data = pd.concat([data, new_entry], ignore_index=True)

        # Save back to Excel
        data.to_excel(file_path, index=False)
        #print(f"Attendance marked for {name}")
    else:
        #print(f"{name} already marked present")
        pass
