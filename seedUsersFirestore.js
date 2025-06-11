const { initializeApp } = require('firebase/app');
const { getFirestore, collection, doc, setDoc } = require('firebase/firestore');

// Firebase config - replace with your actual config
const firebaseConfig = {
  // Your Firebase config here
  // You can get this from your Firebase project settings
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// Sample users with complete profile data
const sampleUsers = [
  {
    id: 'user1',
    displayName: 'Sarah Johnson',
    companyName: 'Johnson Photography',
    phone: '+1 (555) 123-4567',
    email: 'sarah@johnsonphoto.com',
    website: 'https://johnsonphoto.com',
    photoURL: 'https://ui-avatars.com/api/?name=Sarah+Johnson&background=e74c3c&color=fff&size=128',
    social: {
      instagram: 'sarahjohnsonphoto',
      facebook: 'johnsonphotostudio',
      youtube: 'sarahj_photography',
      // No TikTok for this user
    }
  },
  {
    id: 'user2',
    displayName: 'Michael Chen',
    companyName: 'Chen Catering Co.',
    phone: '+1 (555) 234-5678',
    email: 'mike@chencatering.com',
    website: 'https://chencatering.com',
    photoURL: 'https://ui-avatars.com/api/?name=Michael+Chen&background=3498db&color=fff&size=128',
    social: {
      instagram: 'chencatering',
      facebook: 'chencateringcompany',
      tiktok: 'chef_mike_chen',
      // No YouTube for this user
    }
  },
  {
    id: 'user3',
    displayName: 'Emily Rodriguez',
    companyName: 'Bloom Floral Design',
    phone: '+1 (555) 345-6789',
    email: 'emily@bloomfloral.com',
    website: 'https://bloomfloraldesign.com',
    photoURL: 'https://ui-avatars.com/api/?name=Emily+Rodriguez&background=2ecc71&color=fff&size=128',
    social: {
      instagram: 'bloomfloraldesign',
      youtube: 'bloomfloral_tutorials',
      tiktok: 'bloom_emily',
      // No Facebook for this user
    }
  },
  {
    id: 'user4',
    displayName: 'David Park',
    companyName: 'Park Audio Visual',
    phone: '+1 (555) 456-7890',
    email: 'david@parkav.com',
    website: 'https://parkaudiovisual.com',
    photoURL: 'https://ui-avatars.com/api/?name=David+Park&background=9b59b6&color=fff&size=128',
    social: {
      instagram: 'parkaudiovisual',
      facebook: 'parkavsolutions',
      youtube: 'parkav_tech',
      tiktok: 'david_av_tech',
    }
  },
  {
    id: 'user5',
    displayName: 'Lisa Thompson',
    companyName: 'Sweet Dreams Bakery',
    phone: '+1 (555) 567-8901',
    email: 'lisa@sweetdreamsbakery.com',
    website: 'https://sweetdreamsbakery.com',
    photoURL: 'https://ui-avatars.com/api/?name=Lisa+Thompson&background=f39c12&color=fff&size=128',
    social: {
      instagram: 'sweetdreamsbakes',
      facebook: 'sweetdreamsbakery',
      // No YouTube or TikTok for this user
    }
  },
  {
    id: 'user6',
    displayName: 'James Wilson',
    companyName: 'Wilson Event Planning',
    phone: '+1 (555) 678-9012',
    email: 'james@wilsonevents.com',
    website: 'https://wilsonevents.com',
    photoURL: 'https://ui-avatars.com/api/?name=James+Wilson&background=e67e22&color=fff&size=128',
    social: {
      instagram: 'wilsonevents',
      tiktok: 'james_event_planner',
      // No Facebook or YouTube for this user
    }
  }
];

async function seedUsers() {
  console.log('Starting to seed users...');
  
  try {
    for (const user of sampleUsers) {
      console.log(`Seeding user: ${user.displayName}`);
      
      // Create user document
      await setDoc(doc(db, 'users', user.id), {
        displayName: user.displayName,
        companyName: user.companyName,
        phone: user.phone,
        email: user.email,
        website: user.website,
        photoURL: user.photoURL,
        social: user.social,
        createdAt: new Date(),
        updatedAt: new Date()
      });
      
      console.log(`✅ Successfully seeded user: ${user.displayName}`);
    }
    
    console.log('🎉 All users seeded successfully!');
    console.log(`Total users created: ${sampleUsers.length}`);
    
  } catch (error) {
    console.error('❌ Error seeding users:', error);
  }
}

// Run the seeding function
seedUsers().then(() => {
  console.log('Seeding completed');
  process.exit(0);
}).catch((error) => {
  console.error('Seeding failed:', error);
  process.exit(1);
});

module.exports = { seedUsers, sampleUsers };