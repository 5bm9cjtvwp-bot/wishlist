let firebaseApiPromise;

async function getFirebaseApi() {
  if (!firebaseApiPromise) {
    firebaseApiPromise = (async () => {
      const { initializeApp } = await import('https://www.gstatic.com/firebasejs/12.19.0/firebase-app.js');
      const { getAuth, signInAnonymously } = await import('https://www.gstatic.com/firebasejs/12.19.0/firebase-auth.js');
      const { getFirestore, collection, doc, onSnapshot, runTransaction } = await import('https://www.gstatic.com/firebasejs/12.19.0/firebase-firestore.js');
      const firebaseConfig = {
        apiKey: 'AIzaSyD7KZHUmQX0uSaMdWVHzig86Ds1dZQllAs',
        authDomain: 'wishlist-21fc6.firebaseapp.com',
        projectId: 'wishlist-21fc6',
        storageBucket: 'wishlist-21fc6.firebasestorage.app',
        messagingSenderId: '1040292394794',
        appId: '1:1040292394794:web:cd9baa1c111d8115b39053',
        measurementId: 'G-5GHG6BH58L'
      };
      const app = initializeApp(firebaseConfig);
      const auth = getAuth(app);
      const db = getFirestore(app);
      await signInAnonymously(auth);
      return { db, auth, collection, doc, onSnapshot, runTransaction };
    })();
  }
  return firebaseApiPromise;
}

const buttons = () => [...document.querySelectorAll('.gift')];
const keyFor = (button) => {
  const card = button.closest('.card');
  const link = card?.querySelector('.link')?.href || '';
  return encodeURIComponent(link || card?.querySelector('h3')?.textContent?.trim() || 'wish');
};
const setTaken = (button, taken) => {
  button.classList.toggle('on', taken);
  button.textContent = taken ? '🎁 подарок уже занят' : '🎁 я подарю';
};

window.gift = async (button) => {
  if (!button || button.dataset.busy === '1') return;
  button.dataset.busy = '1';
  button.classList.add('pop');
  try {
    const { db, auth, doc, runTransaction } = await getFirebaseApi();
    const wishRef = doc(db, 'wishes', keyFor(button));
    const result = await runTransaction(db, async (transaction) => {
      const snap = await transaction.get(wishRef);
      const current = snap.exists() ? snap.data() : null;
      const myUid = auth.currentUser?.uid;

      if (current?.taken) {
        if (current.reservedBy === myUid) {
          transaction.set(wishRef, { taken: false, reservedBy: null, updatedAt: Date.now() }, { merge: true });
          return 'cancelled';
        }
        return 'someone-else';
      }

      transaction.set(wishRef, { taken: true, reservedBy: myUid, updatedAt: Date.now() }, { merge: true });
      return 'taken';
    });

    if (result === 'cancelled') {
      setTaken(button, false);
    } else if (result === 'taken') {
      setTaken(button, true);
    } else {
      setTaken(button, true);
    }
  } catch (error) {
    console.error('Firebase gift error:', error);
    button.textContent = '🎁 попробуй ещё раз';
    setTimeout(() => {
      if (!button.classList.contains('on')) button.textContent = '🎁 я подарю';
    }, 1800);
  } finally {
    setTimeout(() => button.classList.remove('pop'), 450);
    button.dataset.busy = '0';
  }
};

getFirebaseApi().then(({ db, collection, onSnapshot }) => {
  onSnapshot(collection(db, 'wishes'), (snapshot) => {
    const taken = new Set();
    snapshot.forEach((item) => {
      if (item.data()?.taken) taken.add(item.id);
    });
    buttons().forEach((button) => setTaken(button, taken.has(keyFor(button))));
  });
}).catch((error) => console.error('Firebase startup error:', error));
