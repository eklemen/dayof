const admin = require('firebase-admin');
const serviceAccount = require('./account-services/dayof-938c3-firebase-adminsdk-fbsvc-ffee3dcdc1.json');

// Initialize Firebase Admin
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

async function checkEvents() {
  try {
    console.log('🔍 Checking all events...');
    
    const eventsQuery = await db.collection('events').get();
    console.log('Total events found:', eventsQuery.size);
    
    eventsQuery.docs.forEach((doc, index) => {
      const data = doc.data();
      console.log(`\nEvent ${index + 1}:`);
      console.log('  ID:', doc.id);
      console.log('  Name:', data.eventName);
      console.log('  Owner:', data.ownerId ? data.ownerId.path : 'None');
    });
    
    // Now check conversations for each event
    console.log('\n🔍 Checking conversations...');
    for (const eventDoc of eventsQuery.docs) {
      const eventId = eventDoc.id;
      const conversationsQuery = await db.collection('conversations')
        .where('eventId', '==', eventId)
        .where('type', '==', 'event')
        .get();
      
      console.log(`\nEvent ${eventId} has ${conversationsQuery.size} conversation(s)`);
      
      if (conversationsQuery.size > 0) {
        const conversationId = conversationsQuery.docs[0].id;
        console.log(`  Conversation ID: ${conversationId}`);
        
        // Check messages
        const messagesQuery = await db.collection(`conversations/${conversationId}/messages`)
          .where('parentMessageId', '==', null)
          .orderBy('createdAt', 'asc')
          .get();
        
        console.log(`  Messages: ${messagesQuery.size}`);
        messagesQuery.docs.forEach((msgDoc, msgIndex) => {
          const msgData = msgDoc.data();
          console.log(`    Message ${msgIndex + 1}: "${msgData.body}" by ${msgData.authorId}`);
        });
      }
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

checkEvents().then(() => {
  console.log('\nScript finished');
  process.exit(0);
}).catch(error => {
  console.error('Script failed:', error);
  process.exit(1);
});