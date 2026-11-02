#!/usr/bin/env python3
"""Isolierte Strukturregression fuer das strenge Bohrregler-Gate im nativen Zoom.

Diese Tests belegen den Aufrufvertrag, nicht die tatsaechliche Browserbedienung.
"""
import ast
import unittest
from pathlib import Path

TARGET = Path(__file__).with_name("test_browser_native_zoom_drill_v194.py")


class NativeZoomDrillGateContract(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        source = TARGET.read_text(encoding="utf-8")
        tree = ast.parse(source, filename=str(TARGET))
        cls.function = next(
            node for node in tree.body
            if isinstance(node, ast.FunctionDef) and node.name == "run_drill"
        )
        cls.calls = [node for node in ast.walk(cls.function)
                     if isinstance(node, ast.Call)]
        cls.source = ast.get_source_segment(source, cls.function)

    def test_gate_before_home_and_arrows(self):
        gate = [node.lineno for node in self.calls
                if isinstance(node.func, ast.Name)
                and node.func.id == "assert_pressure_keyboard_ready"]
        keys = {
            node.args[0].value: node.lineno
            for node in self.calls
            if isinstance(node.func, ast.Attribute)
            and node.func.attr == "press"
            and node.args
            and isinstance(node.args[0], ast.Constant)
            and node.args[0].value in ("Home", "ArrowRight")
        }
        self.assertEqual(len(gate), 1)
        self.assertEqual(set(keys), {"Home", "ArrowRight"})
        self.assertLess(gate[0], keys["Home"])
        self.assertLess(gate[0], keys["ArrowRight"])

    def test_no_direct_focus_or_click_bypass(self):
        forbidden = [node for node in self.calls
                     if (isinstance(node.func, ast.Name)
                         and node.func.id == "tab_to")
                     or (isinstance(node.func, ast.Attribute)
                         and node.func.attr in ("focus", "click"))]
        self.assertFalse(forbidden, "Keine direkte Fokussetzung oder Klick-Abkuerzung")

    def test_focus_retained_after_home_and_arrows(self):
        self.assertIn("Reglerfokus nach Home erhalten", self.source)
        self.assertIn("Reglerfokus nach Pfeiltasten erhalten", self.source)
        self.assertGreaterEqual(self.source.count("document.activeElement === el"), 2)
        self.assertGreaterEqual(self.source.count("el.matches(':focus-visible')"), 2)


if __name__ == "__main__":
    unittest.main()
