use crate::{controller::operations::operation::Operation, grid::SheetId};

use super::*;

impl BordersA1 {
    /// Sets the borders for a selection.
    pub fn set_borders_a1(
        &mut self,
        sheet_id: SheetId,
        borders: &BordersA1Updates,
    ) -> Vec<Operation> {
        let reverse_borders = BordersA1Updates {
            left: borders.left.as_ref().map(|value| self.left.set_from(value)),
            right: borders
                .right
                .as_ref()
                .map(|value| self.right.set_from(value)),
            top: borders.top.as_ref().map(|value| self.top.set_from(value)),
            bottom: borders
                .bottom
                .as_ref()
                .map(|value| self.bottom.set_from(value)),
        };

        vec![Operation::SetBordersA1 {
            sheet_id,
            borders: reverse_borders,
        }]
    }

    /// Applies the updates to the borders and returns an update to undo the changes.
    pub fn apply_updates(&mut self, updates: &BordersA1Updates) -> BordersA1Updates {
        BordersA1Updates {
            left: updates.left.as_ref().map(|value| self.left.set_from(value)),
            right: updates
                .right
                .as_ref()
                .map(|value| self.right.set_from(value)),
            top: updates.top.as_ref().map(|value| self.top.set_from(value)),
            bottom: updates
                .bottom
                .as_ref()
                .map(|value| self.bottom.set_from(value)),
        }
    }
}
