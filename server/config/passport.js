import passport from 'passport';
import { Strategy as LocalStrategy } from 'passport-local';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import bcrypt from 'bcryptjs';
import { db, users } from '../db/index.js';
import { eq } from 'drizzle-orm';

// Serialize user for session
passport.serializeUser((user, done) => {
  done(null, user.id);
});

// Deserialize user from session
passport.deserializeUser(async (id, done) => {
  try {
    const user = await db.select()
      .from(users)
      .where(eq(users.id, id))
      .limit(1);
    
    if (user.length) {
      done(null, user[0]);
    } else {
      done(null, false);
    }
  } catch (error) {
    done(error, null);
  }
});

// Local Strategy
passport.use(new LocalStrategy({
  usernameField: 'email',
  passwordField: 'password'
}, async (email, password, done) => {
  try {
    // Find user by email
    const user = await db.select()
      .from(users)
      .where(eq(users.email, email.toLowerCase()))
      .limit(1);

    if (!user.length) {
      return done(null, false, { message: 'No user found with this email address.' });
    }

    const foundUser = user[0];

    // Check if user has a password (not OAuth only)
    if (!foundUser.password) {
      return done(null, false, { message: 'Please sign in with Google or reset your password.' });
    }

    // Verify password
    const isValidPassword = await bcrypt.compare(password, foundUser.password);
    
    if (!isValidPassword) {
      return done(null, false, { message: 'Incorrect password.' });
    }

    // Update last active
    await db.update(users)
      .set({ lastActive: new Date() })
      .where(eq(users.id, foundUser.id));

    return done(null, foundUser);
  } catch (error) {
    return done(error);
  }
}));

// Google OAuth Strategy
if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
  passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: process.env.GOOGLE_CALLBACK_URL || "/auth/google/callback"
  }, async (accessToken, refreshToken, profile, done) => {
    try {
      // Check if user already exists with this Google ID
      let user = await db.select()
        .from(users)
        .where(eq(users.googleId, profile.id))
        .limit(1);

      if (user.length) {
        // User exists, update last active and return
        await db.update(users)
          .set({ lastActive: new Date() })
          .where(eq(users.id, user[0].id));
        
        return done(null, user[0]);
      }

      // Check if user exists with same email
      const email = profile.emails?.[0]?.value;
      if (email) {
        user = await db.select()
          .from(users)
          .where(eq(users.email, email.toLowerCase()))
          .limit(1);

        if (user.length) {
          // Link Google account to existing user
          await db.update(users)
            .set({ 
              googleId: profile.id,
              lastActive: new Date(),
              avatar: profile.photos?.[0]?.value || user[0].avatar
            })
            .where(eq(users.id, user[0].id));
          
          return done(null, user[0]);
        }
      }

      // Create new user
      if (!email) {
        return done(new Error('No email provided by Google'), null);
      }

      const newUser = await db.insert(users)
        .values({
          email: email.toLowerCase(),
          googleId: profile.id,
          firstName: profile.name?.givenName || '',
          lastName: profile.name?.familyName || '',
          avatar: profile.photos?.[0]?.value || null,
          isVerified: true, // Google accounts are pre-verified
          lastActive: new Date()
        })
        .returning();

      return done(null, newUser[0]);
    } catch (error) {
      return done(error, null);
    }
  }));
}

export default passport;