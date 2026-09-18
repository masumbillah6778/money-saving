MONEY SAVING APPS — CLEAN ONLINE BASE
========================================

এই Version-এ আগের ভুল patchগুলো বাদ দিয়ে Local Version-এর feature structure ধরে
পরিষ্কার Online foundation তৈরি করা হয়েছে।

প্রথম পরীক্ষা:
1) firebase.js-এ আপনার Firebase Web App-এর apiKey এবং appId বসান।
2) Firebase Authentication-এ Google provider Enabled রাখুন।
3) Firebase Authentication > Settings > Authorized domains-এ GitHub Pages domain রাখুন।
4) firestore.rules Firebase Console-এ Publish করুন।
5) GitHub Pages থেকে index.html বা user.html খুলুন।

IMPORTANT:
- Local Acode preview-কে Google/Firebase production login test হিসেবে ব্যবহার করবেন না।
- User Panel: user.html
- Admin Panel: admin.html
- index.html শুধু user.html-এ পাঠায়।
- User profile: users/{UID}
- Deposits: users/{UID}/deposits/{depositId}
- User শুধু নিজের Firebase UID-এর data access করতে পারে।
- এই Version-এ global counter ব্যবহার করা হয়নি, তাই security দুর্বল করার জন্য counter write permission খোলা হয়নি।

MEMBER ID:
Local requirement অনুযায়ী 6778 prefix রাখা হয়েছে। প্রথম secure client version-এ UID থেকে stable
unique ID তৈরি হয়। সত্যিকারের sequential 6778xxxxxx allocation চাইলে পরের ধাপে trusted
server/Cloud Function দিয়ে allocator করা উচিত; client দিয়ে global counter খুলে দেওয়া নিরাপদ নয়।

FIREBASE CONFIG:
apiKey এবং appId আমি অনুমান করে বসাইনি। আপনার Firebase Console-এর Web App config থেকে
সঠিক দুটো value বসাতে হবে।
