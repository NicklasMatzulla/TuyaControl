/*
 * Copyright (c) 2024 Nicklas Matzulla
 */

import streamDeck, { LogLevel } from "@elgato/streamdeck";
import { Lamp } from "./actions/lamp";
import {connectToDevice} from "./controller/LightController";

// We can enable "trace" logging so that all messages between the Stream Deck, and the plugin are recorded. When storing sensitive information
streamDeck.logger.setLevel(LogLevel.DEBUG);

// Register the increment action.
streamDeck.actions.registerAction(new Lamp());

// Finally, connect to the Stream Deck.
streamDeck.connect();

connectToDevice()