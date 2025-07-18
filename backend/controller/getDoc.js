import admin, { db } from '../FirebaseAdmin/fireadmin.js';


const getDoc =  async (req, res) => {
  try {
    const snapshot = await db.collection('documents').get()

    if (snapshot.empty) {
      return res.status(200).json({ documents: [] })
    }

    const documents = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data()
    }))

    res.status(200).json({ documents })
  } catch (error) {
    console.error('Error fetching documents:', error.message)
    res.status(500).json({ error: 'Internal Server Error', details: error.message })
  }
}

export default getDoc