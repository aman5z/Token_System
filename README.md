 Token Queue Management System
Short Description
A browser-based token queue management system with live display, ticket printing, and multi-counter support for service centers.


<img width="1919" height="1079" alt="Screenshot 2026-03-06 131238" src="https://github.com/user-attachments/assets/39a402c4-1525-4da6-9358-b2cec073c8be" />
<img width="1919" height="1079" alt="Screenshot 2026-03-06 131233" src="https://github.com/user-attachments/assets/ba16414d-6300-416f-8190-de0aa87673bd" />
<img width="676" height="838" alt="Screenshot 2026-03-06 131200" src="https://github.com/user-attachments/assets/ff0a61b5-a951-4ed9-a31c-e41cc5590959" />
<img width="674" height="835" alt="Screenshot 2026-03-06 131149" src="https://github.com/user-attachments/assets/afb7ffd5-4948-4d07-b054-6eb28d5a789e" />


Detailed Description
This project is a web-based token queue management system designed for environments such as clinics, service centers, banks, and offices. It allows operators to generate and manage service tokens while displaying the current token numbers on a separate live display screen.

The system includes an operator dashboard where users can log in, manage service counters, and generate tokens. A separate public display interface shows current tokens in real time with visual alerts and audio announcements.

The backend uses Google Apps Script as a lightweight API, allowing real-time synchronization without requiring a dedicated server.

The interface supports dark/light themes, printing functionality, responsive design, and voice announcements, making it suitable for both operator terminals and public display screens.

Key Features
User Authentication
Secure login system
Token-based session management
Optional "Remember Me" functionality

Token Management
Generate next token
Repeat previous token
Move back to previous token
Automatic token prefix system
Counter Administration
Add new counters
Rename counters
Delete counters
Admin-only management controls

Live Display Screen
Separate public display interface
Automatic real-time token updates
Flash animation for new tokens
Voice announcements using Web Speech API
Beep alerts for new tokens

Ticket Printing
Printable service tickets
Custom headings and branding
Logo upload
Timestamp printing

Technologies Used
HTML5
CSS3
JavaScript
Google Apps Script
Web Speech API

Web Audio API

JSONP API communication

LocalStorage / SessionStorage

