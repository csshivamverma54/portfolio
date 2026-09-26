import os
import cv2
import numpy as np

def extract_frames():
    video_path = 'character.mp4'
    output_dir = os.path.join('public', 'frames')
    os.makedirs(output_dir, exist_ok=True)

    cap = cv2.VideoCapture(video_path)
    if not cap.isOpened():
        raise RuntimeError(f"Could not open video file: {video_path}")

    total_frames = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))
    fps = cap.get(cv2.CAP_PROP_FPS)
    width = int(cap.get(cv2.CAP_PROP_FRAME_WIDTH))
    height = int(cap.get(cv2.CAP_PROP_FRAME_HEIGHT))
    print(f"Loaded {video_path}: {width}x{height}, {fps} FPS, {total_frames} frames.")

    # 8 Compass Directions Frame Landmarks (Angle measured clockwise from 0° = UP):
    # 0°   (UP):         Frame 16
    # 45°  (UP-RIGHT):   Frame 40
    # 90°  (RIGHT):      Frame 70
    # 135° (DOWN-RIGHT): Frame 96
    # 180° (DOWN):       Frame 114
    # 225° (DOWN-LEFT):  Frame 133
    # 270° (LEFT):       Frame 155
    # 315° (UP-LEFT):    Frame 168
    # 360° (UP - wrap):  Frame 176
    key_angles = np.array([0, 45, 90, 135, 180, 225, 270, 315, 360], dtype=float)
    key_frames = np.array([16, 40, 70,  96, 114, 133, 155, 168, 176], dtype=float)

    # 64 target angles evenly spaced from 0 to 360 degrees (each ~5.625° apart)
    target_angles = np.linspace(0, 360, 64, endpoint=False)
    target_frames = np.interp(target_angles, key_angles, key_frames)

    # Pre-extract all video frames into memory to allow fast random access
    print("Reading video frames into memory...")
    frames_cache = {}
    cap.set(cv2.CAP_PROP_POS_FRAMES, 0)
    idx = 0
    while True:
        ret, frame = cap.read()
        if not ret:
            break
        frames_cache[idx] = frame
        idx += 1

    print(f"Cached {len(frames_cache)} frames.")

    # 1. Extract 64 circular frames
    print("Saving 64 WebP circular trajectory frames...")
    for i, (ang, f_num) in enumerate(zip(target_angles, target_frames)):
        exact_frame_idx = int(round(f_num))
        exact_frame_idx = max(0, min(exact_frame_idx, total_frames - 1))
        frame = frames_cache[exact_frame_idx]

        out_name = f"frame_{i:02d}.webp"
        out_path = os.path.join(output_dir, out_name)
        cv2.imwrite(out_path, frame, [cv2.IMWRITE_WEBP_QUALITY, 95])
        # Also save as frame_{i}.webp (e.g. frame_0.webp)
        alt_path = os.path.join(output_dir, f"frame_{i}.webp")
        cv2.imwrite(alt_path, frame, [cv2.IMWRITE_WEBP_QUALITY, 95])

        if i % 8 == 0:
            print(f"  Frame {i:2d} ({ang:5.1f}°): video frame #{exact_frame_idx} -> {out_name}")

    # 2. Extract CENTER neutral frame (Frame 185)
    center_frame_idx = 185
    center_frame = frames_cache[center_frame_idx]
    center_path = os.path.join(output_dir, "center.webp")
    cv2.imwrite(center_path, center_frame, [cv2.IMWRITE_WEBP_QUALITY, 95])
    print(f"Saved CENTER frame: video frame #{center_frame_idx} -> {center_path}")

    cap.release()
    print("Frame extraction completed successfully!")

if __name__ == '__main__':
    extract_frames()
