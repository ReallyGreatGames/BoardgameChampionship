// Claims react-native-web's style element under a non-colliding id, before
// RN-web's own StyleSheet module initializes it.
//
// RN-web injects <style id="react-native-stylesheet"> as the FIRST child of
// <head>, and populates it through CSSOM insertRule, so the element's
// innerHTML stays empty. Preview harnesses that locate a mount node with a
// selector like `#root, [id^="r"]` therefore match this style element first
// (document order puts head before body) and read the card as "root empty"
// even though the components rendered fine.
//
// createSheet(root, id) takes an explicit id and keeps whichever sheet is
// created first (`sheets.length === 0`), so claiming it here — from a module
// imported before anything that pulls in StyleSheet — makes every later
// RN-web call reuse this element instead of creating the default-id one.
import { createSheet } from "react-native-web/dist/exports/StyleSheet/dom";

createSheet(null, "ds-rnw-stylesheet");
