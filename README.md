# signable

# Table of Contents
[Features](#features)\
[Installation](#installation)\
[Routes](#routes)\
[Project Structure](#project-structure)\
[Database & Storage](#database--storage)\
[CI/CD](#cicd)


## Features
### ASL Practice
This page primarily features our Sign Language Recognition Model. Users begin by selecting a course and a corresponding set within the course that they have created.

Next, users practice finger spelling each of the words in their vocabulary set until they master all of the words. Users will hit the start processing button to process their sign.

The Chatbot will advise the user on how to correct their hand signing to match the letter.

### Flashcards
This page hosts Alphabet Sign Flashcards for users to practice. Users can cycle through the flashcards and indicate whether or not they got the sign correct. When the user gets a flashcard correct, the flashcard moves to the Mastered tab. When a user gets a flashcard incorrect, it moves to the Learning tab. 

### Memory Game
The memory game gives a short tutorial on how the game works by explaining that users will be matching equivalent cards. Users can pick between easy, medium, and hard difficulties. The difficulties change the number of cards from 8 to 12 to 18 respectively. Users are timed on how long it takes them to win and can practice their signs accordingly.

### ASL-Lex
Our ASL dictionary ASL-Lex can be accessed through the vocab search bar or through the dedicated ASL-Lex route. Users will type in their desired words and the dictionary will return a signed translation of the closest word in ASL by a trained ASL researcher. The results will also include various variations in how to sign words when applicable.

### Library
My library allows users to create courses for their various ASL classes. Each course includes Notes & Sets. Notes allow users to take notes on various signs during class by recording themselves and writing a description of any signs they do. The sets allow users to create terms with associated videos of the user signing the term. These sets can then be imported into other features like the ASL Practice page.

## Installation
### Local Installation
For local installation, begin by cloning the repository:\
```git clone https://github.com/BryanAyala123/signable.git```

Next, simply run with ionic serve.\
```ionic serve```\
A window should appear in your browser that displays your local version of the project. A link is available in the terminal if it does not open automatically.

### Running ASL_Real-Time (deprecated)

Create venv
``` python -m venv test ```

Activate it
``` .\test\Scripts\activate ```

Pip install requirements
``` pip3 install -r requirements.txt ```

Jupyter Notebook
``` jupyter notebook```

Run all on ASL_Real-Time. When prompted to give the url to a jupyter notebook use the one in the terminal, pick a name, etc. Once you do so the file should run and create a camera and gray scale display to test it out with. Note, it takes a while to run the file.

## Routes
```/``` redirects to /welcome.\
```/welcome``` Project landing page.\
```/study``` displays ASL Practice, Flashcards, and Memory Game\
```/slr``` allows users to fingerspell their sets\
```/flashcards/alphabet``` allows users to pratice signing the alphabet.\
```/games```Displays tutorial/difficulty along with future games\
```/games/memory/{difficulty}``` allows users to play the memory game on chosen difficulty\
```/asl-lex``` allows users to search for the signs of vocab words\
```/library``` displays user courses\
```/library/{course}``` displays notes & sets for the course\
```/library/{course}/notes``` allows users to write to their notes.\
```/library/{course}/sets``` creates a new set and redirects.\
```/library/{course}/sets/{sets}``` allows users to create sets of terms & matching videos.\
```/settings``` displays user settings.\
```/login``` user login.\
```/register``` user create account.

# Project Structure
Signable operates using Ionic and React + Firebase.

Within the public folder are several subfolders contain important files for the project. 

```/assets``` contains assets primarily in the form of SVG used on the various pages.

```/src``` contains various tsx and css files. Routes can be viewed in App.tsx. Components contains several folders for various features on the webapp including features like SignLanguageRecognition, ASL-Lex, VideoNoetaking, etc.

# Database & Storage
All saved data is stored via Firebase in some cacpacity.

## Firestore
Firestore stores data in a complex branching pattern of routes and ID's.

Database Structure is as follows:\
users/{user_id}/courses/{course_id}/notes/{note_id}\
users/{user_id}/courses/{course_id}/sets/{set_id}\
Courses, Notes, and Sets also have additional fields.

## Storage
Firebase Storage is used to store large filetypes such as videos.

Notes & Sets will contain a field called ```url``` that stores a link to the firebase storage location.

Storage Structure is as follows:\
users/{user_id}/notes/{note_id}/video.webm\
users/{user_id}/sets/{set_id}/videos/{video_id}.webm

# CI/CD

We used Firebase to set up the CI/CD workflow. There are 2 files:

1. ```firebase-hosting-merge.yml``` triggers when users push to the main branch. It runs ```npm ci```, ```npm run test```, ```npm run build```, and then it deploys to the live channel.

2. ```firebase-hosting-pull-request.yml``` triggers on any pull request. It runs ```npm ci```, ```npm run build``` to deploy a pull request, and provides a link to access the build under the pull request. Finally, any applicable tests are ran using ```npm run tests```.


