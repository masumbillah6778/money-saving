MONEY SAVING — ONLINE VERSION

এই সংস্করণটি Local Money Saving ফাইলের কাঠামো ধরে Firebase Online করার জন্য তৈরি।
Firebase project: online-secrect-table

ফাইল:
- user.html = User Panel
- admin.html = Admin Panel
- firebase.js = Firebase config
- css/style.css = ডিজাইন
- js/user.js = User logic
- js/admin.js = Admin logic
- firestore.rules = Firestore security rules

Firebase Console-এ অবশ্যই:
1) Authentication > Sign-in method > Google Enable করুন।
2) Authentication > Settings > Authorized domains-এ আপনার GitHub Pages domain যোগ করুন।
3) Firestore Database চালু করুন।
4) firestore.rules Publish করুন।
5) প্রথমবার Admin Google Login করার পর Firestore-এর users collection-এ সেই UID-এর document-এ role: "admin" বসাতে হবে।

গুরুত্বপূর্ণ:
- User-এর নাম Gmail profile name থেকে নেওয়া হয় না; User নিজে নাম দেয়।
- User নিজের deposit দেখতে পারে, Edit/Delete করতে পারে না।
- Admin deposit Delete এবং User Block/Unblock করতে পারে।
- Member ID 6778 দিয়ে শুরু হয় এবং counter অনুযায়ী ধারাবাহিকভাবে তৈরি হয়।
- User View-এ মোট সঞ্চয় দেখা যাবে, কিন্তু সেটি editable নয়।
