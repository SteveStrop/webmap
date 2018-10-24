import unittest
from es import Scraper

class TestEsScraper(unittest.TestCase):
    def test_Scraper_get_outlook_jobs_appointment(self):
        self.assertEqual(Scraper.get_outlook_jobs())
