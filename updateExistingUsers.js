const admin = require('firebase-admin');
const path = require('path');

// Initialize Firebase Admin SDK
const serviceAccount = require('./account-services/dayof-938c3-firebase-adminsdk-fbsvc-ffee3dcdc1.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  projectId: 'dayof-938c3'
});

const db = admin.firestore();

// Enhanced user data with missing fields
const userEnhancements = {
  // Map existing user IDs to their enhanced data
  // These will be applied based on existing users found
  userEnhancements: [
    {
      displayName: 'Sarah Johnson',
      companyName: 'Johnson Photography',
      phone: '+1 (555) 123-4567',
      website: 'https://johnsonphoto.com',
      social: {
        instagram: 'sarahjohnsonphoto',
        facebook: 'johnsonphotostudio',
        youtube: 'sarahj_photography',
        // No TikTok for this user
      }
    },
    {
      displayName: 'Michael Chen',
      companyName: 'Chen Catering Co.',
      phone: '+1 (555) 234-5678',
      website: 'https://chencatering.com',
      social: {
        instagram: 'chencatering',
        facebook: 'chencateringcompany',
        tiktok: 'chef_mike_chen',
        // No YouTube for this user
      }
    },
    {
      displayName: 'Emily Rodriguez',
      companyName: 'Bloom Floral Design',
      phone: '+1 (555) 345-6789',
      website: 'https://bloomfloraldesign.com',
      social: {
        instagram: 'bloomfloraldesign',
        youtube: 'bloomfloral_tutorials',
        tiktok: 'bloom_emily',
        // No Facebook for this user
      }
    },
    {
      displayName: 'David Park',
      companyName: 'Park Audio Visual',
      phone: '+1 (555) 456-7890',
      website: 'https://parkaudiovisual.com',
      social: {
        instagram: 'parkaudiovisual',
        facebook: 'parkavsolutions',
        youtube: 'parkav_tech',
        tiktok: 'david_av_tech',
      }
    },
    {
      displayName: 'Lisa Thompson',
      companyName: 'Sweet Dreams Bakery',
      phone: '+1 (555) 567-8901',
      website: 'https://sweetdreamsbakery.com',
      social: {
        instagram: 'sweetdreamsbakes',
        facebook: 'sweetdreamsbakery',
        // No YouTube or TikTok for this user
      }
    },
    {
      displayName: 'James Wilson',
      companyName: 'Wilson Event Planning',
      phone: '+1 (555) 678-9012',
      website: 'https://wilsonevents.com',
      social: {
        instagram: 'wilsonevents',
        tiktok: 'james_event_planner',
        // No Facebook or YouTube for this user
      }
    }
  ]
};

async function fetchAndUpdateUsers() {
  console.log('Fetching current users from Firestore...');
  
  try {
    // Fetch all users
    const usersSnapshot = await db.collection('users').get();
    
    if (usersSnapshot.empty) {
      console.log('No users found in Firestore.');
      return;
    }
    
    console.log(`Found ${usersSnapshot.size} users in Firestore:`);
    
    const existingUsers = [];
    usersSnapshot.forEach(doc => {
      const userData = doc.data();
      existingUsers.push({
        id: doc.id,
        ...userData
      });
      console.log(`- ${doc.id}: ${userData.displayName || 'No display name'}`);
    });
    
    // Update each user with enhanced data
    let updateCount = 0;
    for (let i = 0; i < existingUsers.length && i < userEnhancements.userEnhancements.length; i++) {
      const user = existingUsers[i];
      const enhancement = userEnhancements.userEnhancements[i];
      
      console.log(`\nUpdating user ${user.id} (${user.displayName})...`);
      
      // Prepare update data - only add missing fields
      const updateData = {
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      };
      
      // Add companyName if missing
      if (!user.companyName && enhancement.companyName) {
        updateData.companyName = enhancement.companyName;
        console.log(`  ✓ Adding companyName: ${enhancement.companyName}`);
      }
      
      // Add phone if missing
      if (!user.phone && enhancement.phone) {
        updateData.phone = enhancement.phone;
        console.log(`  ✓ Adding phone: ${enhancement.phone}`);
      }
      
      // Add website if missing
      if (!user.website && enhancement.website) {
        updateData.website = enhancement.website;
        console.log(`  ✓ Adding website: ${enhancement.website}`);
      }
      
      // Add or update social handles
      if (!user.social || Object.keys(user.social || {}).length === 0) {
        updateData.social = enhancement.social;
        console.log(`  ✓ Adding social handles:`, enhancement.social);
      } else {
        // Merge existing social with new handles
        const mergedSocial = { ...user.social };
        let socialUpdated = false;
        
        Object.keys(enhancement.social).forEach(platform => {
          if (!mergedSocial[platform]) {
            mergedSocial[platform] = enhancement.social[platform];
            socialUpdated = true;
            console.log(`  ✓ Adding ${platform}: ${enhancement.social[platform]}`);
          }
        });
        
        if (socialUpdated) {
          updateData.social = mergedSocial;
        }
      }
      
      // Only update if there are changes
      if (Object.keys(updateData).length > 1) { // More than just updatedAt
        await db.collection('users').doc(user.id).update(updateData);
        updateCount++;
        console.log(`  ✅ Successfully updated user: ${user.displayName}`);
      } else {
        console.log(`  ⏭️  No updates needed for user: ${user.displayName}`);
      }
    }
    
    console.log(`\n🎉 Update completed! Updated ${updateCount} out of ${existingUsers.length} users.`);
    
  } catch (error) {
    console.error('❌ Error updating users:', error);
  }
}

// Run the update function
fetchAndUpdateUsers().then(() => {
  console.log('Update process completed');
  process.exit(0);
}).catch((error) => {
  console.error('Update process failed:', error);
  process.exit(1);
});