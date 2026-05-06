# Firebase Rules

Firestore and Storage rules are deployed separately in Firebase. Keep the admin check aligned between both services.

## Firestore

```js
rules_version = '2';

service cloud.firestore {
  match /databases/{database}/documents {
    function isSignedIn() {
      return request.auth != null;
    }

    function isAdmin() {
      return isSignedIn()
        && request.auth.token.email == 'luks@degrondvraag.com';
    }

    match /essays/{essayId} {
      allow read: if resource.data.status == "published" || isAdmin();
      allow create, update, delete: if isAdmin();
    }

    match /comments/{commentId} {
      allow read: if true;

      allow create: if request.resource.data.articleId is string
        && request.resource.data.name is string
        && request.resource.data.text is string
        && request.resource.data.text.size() > 0
        && request.resource.data.text.size() <= 5000;

      allow update, delete: if isAdmin();
    }

    match /feedback/{feedbackId} {
      allow create: if request.resource.data.text is string
        && request.resource.data.text.size() > 0
        && request.resource.data.text.size() <= 5000
        && request.resource.data.status == "new";

      allow read, update, delete: if isAdmin();
    }

    match /likes/{essayId}/votes/{userId} {
      allow read: if true;

      allow create, update, delete: if isSignedIn()
        && request.auth.uid == userId
        && request.resource.data.type in ["like", "dislike"];
    }
  }
}
```

## Storage

```js
rules_version = '2';

service firebase.storage {
  match /b/{bucket}/o {
    function isSignedIn() {
      return request.auth != null;
    }

    function isAdmin() {
      return isSignedIn()
        && request.auth.token.email == 'luks@degrondvraag.com';
    }

    match /essays/{essayId}/{fileName} {
      allow read: if true;

      allow create, update: if isAdmin()
        && request.resource.size < 10 * 1024 * 1024
        && request.resource.contentType.matches('image/.*');

      allow delete: if isAdmin();
    }
  }
}
```
