# Achiievo 

## Overview

Achiievo is a dynamic leaderboard platform designed to track task completion and reward users based on their achievements. With its gamified approach, Achiievo fosters healthy competition and motivation by allowing participants to accumulate points, awarded by an admin, to climb the leaderboard. This platform is ideal for use in teams, classrooms, or any challenge-based environment where engagement and performance are critical.

Participants can view their ranks, and admins have control over assigning tasks and points, thus maintaining the leaderboard’s integrity and fairness.

## Core Features

- **Leaderboard Management:** Displays participants ranked based on their points.
- **Task Assignment and Completion:** Admins can assign tasks to users and allocate points upon completion.
- **Dynamic User Profiles:** Users have personalized profiles with attributes like full name, department name, points, and an SSHR number.
- **Real-time Updates:** Leaderboards and user profiles update in real-time, ensuring timely feedback and ranking shifts.
- **Caching Mechanism:** Optimizes performance with a caching strategy, minimizing frequent fetches from the database.

## Architecture

### Technologies and Tools

- **React + TypeScript + Vite:** The front-end application uses React with TypeScript for type safety and fast development. Vite is the build tool, offering fast HMR (Hot Module Replacement).
- **Firebase Firestore:** Used as the cloud database, Firebase provides real-time syncing of data such as user scores and tasks.
- **Framer Motion:** Utilized for adding animations, enhancing user interactions and overall UI experience.
- **Firebase Authentication:** Manages secure user access and permissions.
- **Context API:** Used to manage global state efficiently for leaderboard and user details.