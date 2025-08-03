<!-- Use this file to provide workspace-specific custom instructions to Copilot. For more details, visit https://code.visualstudio.com/docs/copilot/copilot-customization#_use-a-githubcopilotinstructionsmd-file -->

# GPS Tracking System - Copilot Instructions

This is a complete GPS tracking system with GSM connectivity that supports both online and offline tracking.

## Project Structure
- `/server/` - Backend API (Node.js/Express/TypeScript)
- `/client/` - Web dashboard (React/TypeScript)
- `/mobile/` - Mobile app (React Native)
- `/arduino/` - Device firmware (Arduino/C++)
- `/docs/` - Documentation and hardware guides

## Key Technologies
- Backend: Node.js, Express, TypeScript, MongoDB, Socket.IO
- Frontend: React, TypeScript, Material-UI, Leaflet maps
- Mobile: React Native, TypeScript
- Hardware: Arduino, GPS modules, GSM modules
- Real-time: WebSockets, MQTT
- Database: MongoDB for location data and device management

## Architecture Patterns
- RESTful API design
- Real-time WebSocket communication
- Event-driven architecture
- Offline-first design for devices
- Microservices-ready structure

## Code Style Guidelines
- Use TypeScript for all JavaScript code
- Follow clean architecture principles
- Implement proper error handling
- Use async/await for asynchronous operations
- Include comprehensive logging
- Write unit tests for critical functions

## Hardware Integration
- Support for multiple GPS modules (NEO-6M, NEO-8M)
- GSM/GPRS modules (SIM800L, SIM7600)
- Power management and battery optimization
- Data compression for efficient transmission

## Security Considerations
- JWT authentication
- API rate limiting
- Data encryption in transit
- Secure device authentication
- Privacy-compliant location data handling
