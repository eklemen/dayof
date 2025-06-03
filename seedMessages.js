const admin = require('firebase-admin');
const serviceAccount = require('./account-services/dayof-938c3-firebase-adminsdk-fbsvc-ffee3dcdc1.json');

// Initialize Firebase Admin
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

async function seedData() {
  try {
    console.log('🔍 Checking current data...');
    
    // 1. Check if event1 exists
    const eventDoc = await db.collection('events').doc('event1').get();
    console.log('Event1 exists:', eventDoc.exists);
    if (eventDoc.exists) {
      console.log('Event1 data:', eventDoc.data());
    }
    
    // 2. Check for conversations with eventId = event1
    const conversationsQuery = await db.collection('conversations')
      .where('eventId', '==', 'event1')
      .where('type', '==', 'event')
      .get();
    
    console.log('Conversations found:', conversationsQuery.size);
    
    let conversationId = null;
    if (conversationsQuery.size > 0) {
      conversationId = conversationsQuery.docs[0].id;
      console.log('Conversation ID:', conversationId);
      console.log('Conversation data:', conversationsQuery.docs[0].data());
      
      // 3. Check messages in this conversation
      const messagesQuery = await db.collection(`conversations/${conversationId}/messages`)
        .where('parentMessageId', '==', null)
        .orderBy('createdAt', 'asc')
        .get();
      
      console.log('Messages found:', messagesQuery.size);
      messagesQuery.docs.forEach((doc, index) => {
        console.log(`Message ${index + 1}:`, doc.id, doc.data());
      });
    }
    
    // 4. Check if users exist
    const usersQuery = await db.collection('users').limit(5).get();
    console.log('Users in database:', usersQuery.size);
    usersQuery.docs.forEach((doc, index) => {
      console.log(`User ${index + 1}:`, doc.id, doc.data());
    });
    
    // 5. Create sample data if none exists
    if (!eventDoc.exists) {
      console.log('📝 Creating event1...');
      await db.collection('events').doc('event1').set({
        eventName: 'Sample Wedding Event',
        ownerId: db.doc('users/user1'),
        venueId: null,
        startDate: admin.firestore.Timestamp.now(),
        endDate: admin.firestore.Timestamp.now(),
        groupCode: 'ABC123',
        isArchived: false,
        createdAt: admin.firestore.FieldValue.serverTimestamp()
      });
      console.log('✅ Event1 created');
    }
    
    // Create sample users if they don't exist
    const user1Doc = await db.collection('users').doc('user1').get();
    if (!user1Doc.exists) {
      console.log('📝 Creating user1...');
      await db.collection('users').doc('user1').set({
        email: 'user1@example.com',
        displayName: 'Alice Johnson',
        photoURL: null,
        createdAt: admin.firestore.FieldValue.serverTimestamp()
      });
      console.log('✅ User1 created');
    }
    
    const user2Doc = await db.collection('users').doc('user2').get();
    if (!user2Doc.exists) {
      console.log('📝 Creating user2...');
      await db.collection('users').doc('user2').set({
        email: 'user2@example.com',
        displayName: 'Bob Smith',
        photoURL: null,
        createdAt: admin.firestore.FieldValue.serverTimestamp()
      });
      console.log('✅ User2 created');
    }
    
    // Create conversation if it doesn't exist
    if (conversationsQuery.size === 0) {
      console.log('📝 Creating conversation for event1...');
      const conversationRef = await db.collection('conversations').add({
        eventId: 'event1',
        type: 'event',
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        participantCount: 0
      });
      conversationId = conversationRef.id;
      console.log('✅ Conversation created:', conversationId);
    }
    
    // Create sample messages if none exist
    if (conversationId) {
      const messagesQuery = await db.collection(`conversations/${conversationId}/messages`)
        .limit(1)
        .get();
      
      if (messagesQuery.size === 0) {
        console.log('📝 Creating sample messages...');
        
        // Message 1
        await db.collection(`conversations/${conversationId}/messages`).add({
          authorId: 'user1',
          body: 'Hello everyone! Excited for the wedding planning!',
          parentMessageId: null,
          reactions: {},
          mentions: [],
          createdAt: admin.firestore.FieldValue.serverTimestamp()
        });
        
        // Message 2
        await db.collection(`conversations/${conversationId}/messages`).add({
          authorId: 'user2',
          body: 'Hi Alice! I can help with the catering options.',
          parentMessageId: null,
          reactions: {},
          mentions: ['user1'],
          createdAt: admin.firestore.FieldValue.serverTimestamp()
        });
        
        // Message 3
        await db.collection(`conversations/${conversationId}/messages`).add({
          authorId: 'user1',
          body: 'That would be great @user2! What are your recommendations?',
          parentMessageId: null,
          reactions: {},
          mentions: ['user2'],
          createdAt: admin.firestore.FieldValue.serverTimestamp()
        });
        
        console.log('✅ Sample messages created');
      }
    }
    
    console.log('🎉 Data seeding complete!');
    
  } catch (error) {
    console.error('❌ Error seeding data:', error);
  }
}

seedData().then(() => {
  console.log('Script finished');
  process.exit(0);
}).catch(error => {
  console.error('Script failed:', error);
  process.exit(1);
});