MONEY SAVING — ONLINE FIXED VERSION

1. GitHub repository-র root-এ সব ফাইল রাখুন।
2. GitHub Pages চালু করুন।
3. Firebase Authentication-এ Google provider Enabled রাখুন।
4. GitHub Pages domain Authorized domains-এ থাকলে আবার যোগ করার দরকার নেই।
5. Firestore Rules হিসেবে firestore.rules-এর নিয়ম Publish করুন।
6. User Panel: user.html অথবা repository root/index.html
7. Admin Panel: admin.html
8. Admin Gmail: masumbillah6778@gmail.com

IMPORTANT:
- এই version-এর Firestore path: users/{uid}/deposits/{depositId}
- আগের app1_users path-এর সঙ্গে এটি মেশে না।
- User শুধু নিজের deposits পড়তে/যোগ করতে পারে। Admin সব User-এর data দেখতে পারে।
