Money Saving Online — fixed data model

1) GitHub Pages-এ এই ফোল্ডারের ফাইলগুলো root-এ রাখুন।
2) Firebase Console > Authentication > Google enabled এবং GitHub domain Authorized রাখুন।
3) Firestore Database > Rules-এ এই প্যাকেজের firestore.rules সম্পূর্ণ paste করে Publish করুন।
4) User data users/{Firebase UID} document-এ থাকবে; deposits একই document-এর array হিসেবে থাকবে।
5) Admin email: masumbillah6778@gmail.com
6) User শুধু নিজের document read/write করতে পারবে; Admin সব user দেখতে পারবে।
