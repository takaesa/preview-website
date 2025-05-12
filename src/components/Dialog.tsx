import {
  Button,
  Dialog,
  DialogContent,
  TextField,
  DialogActions,
  IconButton,
  Typography,
  Toolbar,
  Divider,
  Stack,
} from "@mui/material";

import CloseIcon from "@mui/icons-material/Close";
import "./dialog.css";

import { useState } from "react";

const CustomDialog = () => {
  const [open, setOpen] = useState(false);
  return (
    <>
      <Button
        onClick={() => {
          setOpen(true);
          console.log("popup Modal");
        }}
        id="render-url-btn"
      >
        Submit
      </Button>
      <Dialog
        open={open}
        onClose={() => setOpen(false)}
        aria-labelledby="dialog-title"
        aria-describedby="dialog-description"
      >
        <Toolbar>
          <Typography
            sx={{ ml: 2, flex: 1, textAlign: "center" }}
            variant="h6"
            component="div"
            style={{ fontWeight: "600" }}
          >
            Từ chối duyệt kết quả
          </Typography>
          <IconButton
            edge="end"
            onClick={() => setOpen(false)}
            aria-label="close"
          >
            <CloseIcon />
          </IconButton>
        </Toolbar>

        <Divider />

        <DialogContent>
          <TextField
            style={{ minWidth: "500px", minHeight: "250px", margin: "0" }}
            id="outlined-multiline-flexible"
            label="Mô tả lý do"
            multiline
            rows={10}
            required
            placeholder="Nhập nội dung"
          />
        </DialogContent>

        <Divider />

        <DialogActions style={{ padding: "16px 24px" }}>
          <Stack direction="row" spacing={3}>
            <Button id="cancel-btn" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button id="submit-btn" onClick={() => setOpen(false)} autoFocus>
              Submit
            </Button>
          </Stack>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default CustomDialog;
