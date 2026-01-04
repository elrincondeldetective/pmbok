# OJO: Importamos SimpleTestCase en lugar de TestCase
from django.test import SimpleTestCase


class CiSmokeTest(SimpleTestCase):
    def test_basic_math(self):
        """
        Prueba de humo que NO requiere base de datos.
        """
        self.assertEqual(1 + 1, 2)
