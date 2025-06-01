// // seedFirestore.ts
// import admin from 'firebase-admin';
// import { Timestamp } from 'firebase-admin/firestore';
//
// import serviceAccount from './serviceAccount.json' with { type: "json" };
// admin.initializeApp({
//   credential: admin.credential.cert(serviceAccount)
// });
//
// const db = admin.firestore();
//
//
// const user1fetch = await admin.auth().getUserByEmail('ejklemen@gmail.com');
//
// async function seed() {
//   // Users
//   const user1 = { ...user1fetch };
//   const users = [
//     // { ...user1 },
//     { userId: 'user2', displayName: 'Jane Doe', email: 'jane@example.com' },
//     { userId: 'user3', displayName: 'John Smith', email: 'john@example.com' },
//   ];
//
//   for (const user of users) {
//     await db.collection('users').doc(user.userId).set(user);
//   }
//
//   // Venues
//   const venues = [
//     { venueId: 'venue1', venueName: 'Grand Hall', city: 'New York' },
//     { venueId: 'venue2', venueName: 'Sunset Gardens', city: 'San Francisco' },
//     { venueId: 'venue3', venueName: 'Riverside Pavilion', city: 'Chicago' },
//   ];
//
//   for (const venue of venues) {
//     await db.collection('venues').doc(venue.venueId).set(venue);
//   }
//
//   // Events
//   const events = [
//     {
//       eventId: 'event1',
//       eventName: 'Williams Wedding',
//       ownerId: db.doc(`users/${user1.uid}`),
//       venueId: db.doc('venues/venue1'),
//       startDate: Timestamp.fromDate(new Date('2025-09-12')),
//       endDate: Timestamp.fromDate(new Date('2025-09-12')),
//     },
//     {
//       eventId: 'event2',
//       eventName: 'Tech Conference 2025',
//       ownerId: db.doc(`users/${user1.uid}`),
//       venueId: db.doc('venues/venue2'),
//       startDate: Timestamp.fromDate(new Date('2025-11-05')),
//       endDate: Timestamp.fromDate(new Date('2025-11-07')),
//     },
//     {
//       eventId: 'event3',
//       eventName: 'Annual Fundraiser Gala',
//       ownerId: db.doc(`users/${user1.uid}`),
//       venueId: db.doc('venues/venue3'),
//       startDate: Timestamp.fromDate(new Date('2025-12-01')),
//       endDate: Timestamp.fromDate(new Date('2025-12-01')),
//     },
//   ];
//
//   for (const event of events) {
//     await db.collection('events').doc(event.eventId).set(event);
//   }
//
//   // Categories (under events)
//   for (const event of events) {
//     const categories = [
//       { categoryId: 'florist', name: 'Florist', assignedUserId: user1.uid, createdBy: 'system' },
//       { categoryId: 'caterer', name: 'Caterer', assignedUserId: 'user2', createdBy: 'system' },
//       { categoryId: 'photographer', name: 'Photographer', assignedUserId: null, createdBy: 'system' },
//     ];
//
//     for (const cat of categories) {
//       await db.collection('events').doc(event.eventId).collection('categories').doc(cat.categoryId).set(cat);
//     }
//   }
//
//   // Members (under events)
//   for (const event of events) {
//     const members = [
//       { userId: user1.uid, role: 'owner', joinedAt: Timestamp.now() },
//       { userId: 'user2', role: 'planner', joinedAt: Timestamp.now() },
//       { userId: 'user3', role: 'vendor', joinedAt: Timestamp.now() },
//     ];
//
//     for (const member of members) {
//       await db.collection('events').doc(event.eventId).collection('members').doc(member.userId).set(member);
//     }
//   }
//
//   // Conversations (1 per event)
//   for (const event of events) {
//     await db.collection('conversations').doc(event.eventId).set({
//       conversationId: event.eventId,
//       eventId: db.doc(`events/${event.eventId}`),
//       createdAt: Timestamp.now(),
//     });
//   }
//
//   // Messages (under conversations)
//   const messages = [
//     {
//       messageId: 'msg1',
//       conversationId: 'event1',
//       authorId: user1.uid,
//       body: 'Welcome to the Williams Wedding chat!',
//       createdAt: Timestamp.now(),
//       parentMessageId: null,
//       reactions: {},
//       mentions: [],
//     },
//     {
//       messageId: 'msg2',
//       conversationId: 'event1',
//       authorId: 'user2',
//       body: 'Looking forward to working with everyone!',
//       createdAt: Timestamp.now(),
//       parentMessageId: 'msg1',
//       reactions: { '👍': [user1.uid] },
//       mentions: [user1.uid],
//     },
//     {
//       messageId: 'msg3',
//       conversationId: 'event1',
//       authorId: 'user3',
//       body: 'Let me know if you need anything from photography side.',
//       createdAt: Timestamp.now(),
//       parentMessageId: null,
//       reactions: {},
//       mentions: [],
//     },
//   ];
//
//   for (const msg of messages) {
//     await db
//       .collection('conversations')
//       .doc(msg.conversationId)
//       .collection('messages')
//       .doc(msg.messageId)
//       .set(msg);
//   }
//
//   console.log('Seed data complete!');
// }
//
// seed().catch(console.error);
