**TITLE** 

Avoid waiting rooms in hospitals

**APPLICATION NAME** 

Healthify (A web based application to help avoid waiting rooms in hospitals)

**DESCRIPTION**

Given the situation of current covid pandemic, health care workers are scarce for the given patient influx. With more number of people hospitalized, small changes may go a big way.

Our solution is to bring waiting times down by getting data from the hospitals for each doctor. A patient would get status of the appointment and avoid a potential transmission of the disease by reducing the time the person spends on the hospital grounds. The data will be updated by the hospital.

This method helps hospitals reduce the crowd present on the hospital grounds by a significant amount since patients have to reach only at their given appointment time. Thus over crowding can be prevented and the crowd can be easily managed.

**SOFTWARE REQUIRED**

Node JS (version used for this app is 14.17.0), 
 Mongo DB
 
**PROCESS FLOW**

The application has a separate login and register section for both the doctors and the patients

**Process flow for patient:**

1.	Login if there is an existing account or Register to create an account to use the website.
2.	After a successful login or registration, you will be directed to your home page where the list of all the doctors available and their related information will be displayed.
3.	All your previous and current bookings will be displayed in the “Your Bookings” section.
4.	Pick a suitable doctor and start booking your consultation.
5.	Pick the date for your consultation.
6.	Pick a suitable time slot for your consultation and fill in a few necessary details.
7.	After filling the details, you will receive a confirmation mail and a booking will be made at the chose date and time slot.
8.	Confirm the status of your consultation.
9.	Before going to the hospitals view the status of your consultation.
10.	A status of “No change” indicates that the appointment is on time and there are no changes or waiting time. A status of “Delayed” indicates that the appointment has been delayed by the doctor. Please confirm the rescheduled time on the website. A status of “Rescheduled” indicates that the appointment has been rescheduled to a different date and time. Please confirm the rescheduled date and time on the website.
11.	If an appointment gets rescheduled you need to confirm the reschedule on the website by clicking the “Confirm Reschedule” button and only then a new appointment will be made at the rescheduled date and time. You can always cancel the appointment if the rescheduled date and time is not suitable for you.
12.	Email notifications will be sent if there are any changes to the consultation.

**Process flow for doctors:**

1.	Login if there is an existing account or Register to create an account to use the website.
2.	After a successful login all your booking for that date will be displayed.
3.	Inside the “Your Booking” section all the previous and upcoming consultations will be displayed.
4.	For more information about a consultation click the “view” button and a detailed information about the consultation will be displayed.
5.	Click the “Delay” button to delay an appointment (*Note: you cannot delay an appointment for more than 2 Hours)
6.	Click the “Reschedule” button to reschedule the appointment. Select the reschedule date and time slot. Wait for the confirmation from the patient.
7.	Email notification will be sent if a new appointment is made or an existing appointment is cancelled.

**DATA FLOW**

**PATIENT DATA FLOW**

![patientDataFlow](https://user-images.githubusercontent.com/65529555/119384388-428b7a80-bce2-11eb-9b9f-54fa757e13ec.jpeg)

**DOCTOR DATA FLOW**

![doctorDataFlow](https://user-images.githubusercontent.com/65529555/119384407-4ae3b580-bce2-11eb-9313-3fe197ae48ae.jpeg)




