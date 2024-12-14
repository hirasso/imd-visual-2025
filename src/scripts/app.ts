import '../styles/style.css'

import Alpine from 'alpinejs';
import Float from './components/Float/Float.js';
import Ball from './components/Ball/Ball.js';
import Room from './components/Room/Room.js';

Alpine.data('Float', Float);
Alpine.data('Ball', Ball);
Alpine.data('Room', Room);

Alpine.start();