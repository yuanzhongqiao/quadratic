use super::*;

impl RefRangeBounds {
    /// Translates the range in place by the given delta.
    pub fn translate_in_place(&mut self, x: i64, y: i64) {
        self.start.translate_in_place(x, y);
        if let Some(end) = self.end.as_mut() {
            end.translate_in_place(x, y);
        }
    }

    /// Returns a new range translated by the given delta.
    pub fn translate(&self, x: i64, y: i64) -> Self {
        let mut range = *self;
        range.translate_in_place(x, y);
        range
    }
}

#[cfg(test)]
#[serial_test::parallel]
mod tests {
    use super::*;

    #[test]
    fn test_translate_in_place() {
        // Test single cell translation
        let mut range = RefRangeBounds::test_a1("A1");
        range.translate_in_place(1, 1);
        assert_eq!(range.to_string(), "B2");

        // Test range translation
        let mut range = RefRangeBounds::test_a1("A1:C3");
        range.translate_in_place(1, 1);
        assert_eq!(range.to_string(), "B2:D4");

        // Test column range translation
        let mut range = RefRangeBounds::test_a1("A:C");
        range.translate_in_place(1, 0);
        assert_eq!(range.to_string(), "B:D");

        // Test row range translation
        let mut range = RefRangeBounds::test_a1("1:3");
        range.translate_in_place(0, 1);
        assert_eq!(range.to_string(), "2:4");

        // Test negative translation
        let mut range = RefRangeBounds::test_a1("B2:D4");
        range.translate_in_place(-1, -1);
        assert_eq!(range.to_string(), "A1:C3");

        // Test zero translation
        let mut range = RefRangeBounds::test_a1("A1:C3");
        range.translate_in_place(0, 0);
        assert_eq!(range.to_string(), "A1:C3");

        // Test that * remains unchanged
        let mut range = RefRangeBounds::test_a1("*");
        range.translate_in_place(1, 1);
        assert_eq!(range.to_string(), "*");

        // Test negative translation capping
        let mut range = RefRangeBounds::test_a1("A1");
        range.translate_in_place(-10, -10);
        assert_eq!(range.to_string(), "A1");
    }

    #[test]
    fn test_translate() {
        // Test single cell translation
        let range = RefRangeBounds::test_a1("A1");
        let translated = range.translate(1, 1);
        assert_eq!(translated.to_string(), "B2");
        assert_eq!(range.to_string(), "A1");

        // Test range translation
        let range = RefRangeBounds::test_a1("A1:C3");
        let translated = range.translate(1, 1);
        assert_eq!(translated.to_string(), "B2:D4");
        assert_eq!(range.to_string(), "A1:C3");

        // Test column range translation
        let range = RefRangeBounds::test_a1("A:C");
        let translated = range.translate(1, 0);
        assert_eq!(translated.to_string(), "B:D");
        assert_eq!(range.to_string(), "A:C");

        // Test row range translation
        let range = RefRangeBounds::test_a1("1:3");
        let translated = range.translate(0, 1);
        assert_eq!(translated.to_string(), "2:4");
        assert_eq!(range.to_string(), "1:3");

        // Test negative translation
        let range = RefRangeBounds::test_a1("B2:D4");
        let translated = range.translate(-1, -1);
        assert_eq!(translated.to_string(), "A1:C3");
        assert_eq!(range.to_string(), "B2:D4");

        // Test zero translation
        let range = RefRangeBounds::test_a1("A1:C3");
        let translated = range.translate(0, 0);
        assert_eq!(translated.to_string(), "A1:C3");
        assert_eq!(range.to_string(), "A1:C3");

        // Test that * remains unchanged
        let range = RefRangeBounds::test_a1("*");
        let translated = range.translate(1, 1);
        assert_eq!(translated.to_string(), "*");
        assert_eq!(range.to_string(), "*");

        // Test negative translation capping
        let range = RefRangeBounds::test_a1("A1");
        let translated = range.translate(-10, -10);
        assert_eq!(translated.to_string(), "A1");
        assert_eq!(range.to_string(), "A1");
    }
}
