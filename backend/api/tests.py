from django.test import TestCase


class CiSmokeTest(TestCase):
    def test_basic_math(self):
        """
        Prueba básica para asegurar que el runner de pruebas funciona
        y evitar el error 'exit status 5' por falta de tests.
        """
        self.assertEqual(1 + 1, 2)
