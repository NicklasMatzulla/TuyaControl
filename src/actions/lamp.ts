/*
 * Copyright (c) 2024 Nicklas Matzulla
 */

import {
	action, ActionWithoutPayloadEvent,
	DialDownEvent,
	DialRotateEvent,
	SingletonAction,
	TouchTapEvent,
	WillAppearEvent
} from "@elgato/streamdeck";
import {decreaseBrightness, getBrightness, increaseBrightness, isTurnedOn, toggle} from "../controller/LightController";

import streamDeck, { LogLevel } from "@elgato/streamdeck";

const logger = streamDeck.logger.createScope("Custom Scope");

@action({ UUID: "de.nicklasmatzulla.tuyacontrol.lamp" })
export class Lamp extends SingletonAction {

	async onWillAppear(ev: WillAppearEvent<object>) {
		setInterval(() => {
			const brightness = isTurnedOn() ? getBrightness() / 10 : 0
			ev.action.setFeedback({
				"value": brightness + "%",
				"indicator": brightness
			})
		}, 10)
	}

	async onDialDown(ev: DialDownEvent<object>) {
		toggle()
	}

	async onTouchTap(ev: TouchTapEvent<object>) {
		toggle()
	}

	async onDialRotate(ev: DialRotateEvent<object>) {
		let brightness;
		if (ev.payload.ticks > 0) {
			brightness = increaseBrightness() / 10
		} else {
			brightness = decreaseBrightness() / 10
		}
	}
}