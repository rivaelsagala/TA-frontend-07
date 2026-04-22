# Virtual Frontdesk

Virtual Frontdesk is a modern AI-powered web application that uses advanced technologies to enhance the user experience. Designed as a virtual receptionist, the application can detect the presence of individuals and greet them with AI-generated speech.

## Features

- **AI Greeting**: Detects users and greets them automatically using AI-powered text-to-speech.
- **Customizable Messages**: Ability to configure greeting messages for various scenarios.
- **Scalable Architecture**: Built using Next.js 14 to ensure a smooth and scalable development experience.
- **Intuitive UI**: Provides a simple and user-friendly interface for easy navigation and interaction.

## Installation

To set up the project locally, follow these steps:

```bash
# Navigate to the project directory
cd virtual-frontdesk

# Install dependencies
npm install
```

## Usage

To run the application locally:

```bash
# Start the development server
npm run dev
```

To build the application for production:

```bash
npm run build
npm start
```

## Folder Structure

The project follows the default structure of Next.js 14 with slight modifications:

```
app/
  pages/        # Contains all the pages of the application
components/     # Reusable UI components
public/         # Static assets like images and fonts
utils/          # All sort of utilities function
```

## API Documentation

The application includes the following API endpoint:

- **POST /ai_speech/generate-text**
    - Description: Generates text output based on the emotion, user gender, time, tone
    - Request Body:
      ```json
      {
        "emotion": "neutral",
        "gender": "Male",
        "time": "14:31:14",
        "tone": "santai"
      }
      ```
    - Response:
      ```json
      {
        "text": "Hi there! Good afternoon! How's your day going so far?"
      }
      ```
  - **POST /ai_speech/generate-audio**
    - Description: Generates wav file based on the provided text and preset gender.
    - Request Body:
      ```json
      {
        "text": "Hi, how's it going?",
        "gender": "female"
      }
      ```

## License

This project is licensed under the MIT License. See the LICENSE file for more details.

