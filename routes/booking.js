const express = require("express");
const router = express.Router();
const Booking = require("../models/booking");
const Listing = require("../models/listing");
const User = require("../models/user");
const PDFDocument = require("pdfkit");
const { isLoggedIn } = require("../middleware");
const nodemailer = require("nodemailer");
const streamBuffers = require("stream-buffers");
router.post("/:id/book", isLoggedIn, async (req, res) => {
  const listing = await Listing.findById(req.params.id);
  const user = await User.findById(req.user._id);
  const { checkIn, checkOut, roomType } = req.body;

  if (
    (roomType === "AC" && listing.roomsAcAvailable <= 0) ||
    (roomType === "Non-AC" && listing.roomsNonAcAvailable <= 0)
  ) {
    req.flash("error", `No ${roomType} rooms available.`);
    return res.redirect(`/listings/${listing._id}`);
  }

  const booking = new Booking({
    listing: listing._id,
    user: user._id,
    checkIn,
    checkOut,
    roomType,
  });

  await booking.save();

  if (roomType === "AC") {
    listing.roomsAcAvailable -= 1;
  } else {
    listing.roomsNonAcAvailable -= 1;
  }

  await listing.save();

  // Generate PDF in memory
  const doc = new PDFDocument();
  const bufferStream = new streamBuffers.WritableStreamBuffer();

  doc.pipe(bufferStream);
  doc.fontSize(18).text("Booking Confirmation", { underline: true });
  doc.moveDown();
  doc.fontSize(12).text(`Hotel Name: ${listing.title}`);
  doc.text(`Location: ${listing.location}, ${listing.country}`);
  doc.text(`Room Type: ${roomType}`);
  doc.text(`Check-In: ${new Date(checkIn).toDateString()}`);
  doc.text(`Check-Out: ${new Date(checkOut).toDateString()}`);
  doc.text(`Booking Date: ${new Date().toDateString()}`);
  doc.moveDown();
  doc.text(`Customer: ${user.username}`);
  doc.text(`Email: ${user.email}`);
  doc.end();
  bufferStream.on("finish", async () => {
    const pdfBuffer = bufferStream.getContents();
  
    if (!pdfBuffer) {
      console.error("PDF buffer generation failed.");
      req.flash("error", "Booking done, but failed to generate PDF.");
      return res.redirect(`/listings/${listing._id}`);
    }
    // 📧 Email setup
    const transporter = nodemailer.createTransport({
      service: "Gmail",
      auth: {
        user: "ashu6260436@gmail.com",
        pass: "juvlppqaoupqwupz", // ✅ App password
      },
    });

    const mailOptions = {
      from: '"Hotel Booking" <ashu6260436@gmail.com>',
      to: user.email,
      subject: "Your Booking Confirmation",
      text: "Attached is your booking confirmation.",
      attachments: [
        {
          filename: "booking-confirmation.pdf",
          content: pdfBuffer,
        },
      ],
    };

    try {
      await transporter.sendMail(mailOptions);
      req.flash("success", "Booking successful! Confirmation sent to your email.");
    } catch (error) {
      console.error("Error sending email:", error);
      req.flash("error", "Booking done, but failed to send email.");
    }

    // 📥 Store PDF in session for download
    req.session.pdfBuffer = pdfBuffer;
    req.session.save(() => {
      res.redirect(`/bookings/${booking._id}/download`);
    });
  });
});

// download route 
router.get("/:id/download", isLoggedIn, async (req, res) => {
  const pdfBuffer = req.session.pdfBuffer;

  if (!pdfBuffer) {
    req.flash("error", "No booking confirmation available for download.");
    return res.redirect("/listings");
  }

  res.setHeader("Content-Type", "application/pdf");
  res.setHeader("Content-Disposition", "attachment; filename=booking-confirmation.pdf");
  res.send(pdfBuffer);

  // Optionally clear buffer from session
  delete req.session.pdfBuffer;
});


// Cancel Booking Route
router.post("/:id/cancel", isLoggedIn, async (req, res) => {
  try {
    const bookingId = req.params.id;
    const booking = await Booking.findById(bookingId).populate("listing user");

    if (!booking) {
      req.flash("error", "Booking not found.");
      return res.redirect("/profile");
    }

    const listing = booking.listing;

    // Update room availability
    if (booking.roomType === "AC") {
      listing.roomsAcAvailable += 1;
    } else {
      listing.roomsNonAcAvailable += 1;
    }

    booking.status = "Canceled";
    await booking.save();
    await listing.save();

    // Generate PDF
    const doc = new PDFDocument();
    const bufferStream = new streamBuffers.WritableStreamBuffer();

    doc.pipe(bufferStream);
    doc.fontSize(18).text("Booking Cancellation Confirmation", { underline: true });
    doc.moveDown();
    doc.fontSize(12).text(`Hotel Name: ${listing.title}`);
    doc.text(`Location: ${listing.location}, ${listing.country}`);
    doc.text(`Room Type: ${booking.roomType}`);
    doc.text(`Check-In: ${new Date(booking.checkIn).toDateString()}`);
    doc.text(`Check-Out: ${new Date(booking.checkOut).toDateString()}`);
    doc.text(`Cancellation Date: ${new Date().toDateString()}`);
    doc.moveDown();
    doc.text(`Customer: ${booking.user.username}`);
    doc.text(`Email: ${booking.user.email}`);
    doc.end();

    bufferStream.on("finish", async () => {
      const pdfBuffer = bufferStream.getContents();

      if (!pdfBuffer) {
        console.error("PDF buffer generation failed.");
        req.flash("error", "Booking canceled, but failed to generate PDF.");
        return res.redirect("/profile");
      }

      // Email the receipt
      const transporter = nodemailer.createTransport({
        service: "Gmail",
        auth: {
          user: "ashu6260436@gmail.com",
          pass: "juvlppqaoupqwupz",
        },
      });

      const mailOptions = {
        from: '"Hotel Booking" <your-email@gmail.com>',
        to: booking.user.email,
        subject: "Booking Cancellation Confirmation",
        text: "Attached is your booking cancellation confirmation.",
        attachments: [
          {
            filename: "cancellation-confirmation.pdf",
            content: pdfBuffer,
          },
        ],
      };

      try {
        await transporter.sendMail(mailOptions);
        req.flash("success", "Booking canceled and confirmation sent to your email.");
      } catch (error) {
        console.error("Error sending email:", error);
        req.flash("error", "Booking canceled, but failed to send email.");
      }

      // Store PDF in session and redirect to download
      req.session.pdfBuffer = pdfBuffer;
      req.session.save(() => {
        return res.redirect(`/bookings/${booking._id}/cdownload`);
      });
      
    });

  } catch (err) {
    console.error(err);
    req.flash("error", "Error canceling booking.");
    res.redirect("/profile");
  }
});

// Download Route for Cancellation Receipt
router.get("/:id/cdownload", isLoggedIn, (req, res) => {
  const pdfBuffer = req.session.pdfBuffer;

  if (!pdfBuffer) {
    req.flash("error", "No booking confirmation available for download.");
    return res.redirect("/profile");
  }

  res.setHeader("Content-Type", "application/pdf");
  res.setHeader("Content-Disposition", "attachment; filename=booking-cancellation.pdf");
  res.send(pdfBuffer);

  delete req.session.pdfBuffer;
});

// DELETE canceled booking
router.post('/:id/delete', async (req, res) => {
  try {
    await Booking.findByIdAndDelete(req.params.id);
    req.flash('success', 'Canceled booking removed.');
    res.redirect('/profile');
  } catch (err) {
    console.error(err);
    req.flash('error', 'Error deleting booking.');
    res.redirect('/profile');
  }
});


module.exports = router;