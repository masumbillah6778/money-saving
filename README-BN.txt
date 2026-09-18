MONEY SAVING — ONLINE UPDATED VERSION

1. GitHub repository-র root-এ সব ফাইল রাখুন।
2. GitHub Pages চালু করুন।
3. Firebase Authentication-এ Google provider Enabled রাখুন।
4. GitHub Pages domain Firebase Authentication > Authorized domains-এ থাকতে হবে।
5. Firestore Database > Rules-এ এই ZIP-এর firestore.rules-এর সম্পূর্ণ কোড Publish করুন।
6. প্রথমে index.html খুলুন; এটি user.html-এ পাঠাবে।
7. Admin Panel: admin.html
8. Admin Gmail: masumbillah6778@gmail.com

Firestore structure:
users/{Firebase Auth UID}
users/{Firebase Auth UID}/deposits/{depositId}

User নিজের profile এবং নিজের deposits পড়তে/যোগ করতে পারে। অন্য User-এর data পড়তে পারে না।
Admin configured Gmail সব User/deposits পড়তে পারে এবং deposit delete করতে পারে।

নোট: Acode localhost-এ Firebase Google Login নির্ভরযোগ্যভাবে পরীক্ষা না করে GitHub Pages HTTPS URL-এ পরীক্ষা করুন।
