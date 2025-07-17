 export const verifyToken = async (req, res) => {
  const { idToken } = req.body;

  try {
    const decodedToken = await admin.auth().verifyIdToken(idToken);
    const uid = decodedToken.uid;
    res.json({ uid, email: decodedToken.email });
  } catch (err) {
    console.error(err);
    res.status(401).json({ error: 'Invalid token' });
  }
}