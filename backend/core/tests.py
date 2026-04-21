from django.core.exceptions import ImproperlyConfigured
from django.test import SimpleTestCase, override_settings

from .views import get_gigachat_credentials


class GigaChatCredentialsTests(SimpleTestCase):
    @override_settings(GIGACHAT_CREDENTIALS='env-token')
    def test_reads_credentials_from_settings(self):
        self.assertEqual(get_gigachat_credentials(), 'env-token')

    @override_settings(GIGACHAT_CREDENTIALS='')
    def test_requires_credentials_in_settings(self):
        with self.assertRaisesMessage(ImproperlyConfigured, 'GIGACHAT_CREDENTIALS'):
            get_gigachat_credentials()
