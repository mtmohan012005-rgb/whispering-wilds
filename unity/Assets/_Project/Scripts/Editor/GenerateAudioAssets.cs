using System;
using System.IO;
using UnityEngine;
using UnityEditor;

namespace WhisperingWilds.Editor
{
    public class GenerateAudioAssets : EditorWindow
    {
        [MenuItem("Tools/Generate Temple Audio")]
        public static void Generate()
        {
            string baseDir = "Assets/_Project/Audio";
            string[] dirs = { "Ambience", "Footsteps", "Interactions", "Music", "UI" };
            foreach (var d in dirs)
            {
                Directory.CreateDirectory(Path.Combine(Application.dataPath, "..", "..", "..", "..", "unity", "Assets", "_Project", "Audio", d));
            }

            // Generate minimal WAV files (1 second, 22050 Hz, mono, 16-bit)
            GenerateWav(Path.Combine(Application.dataPath, "_Project", "Audio", "Ambience", "temple_ambience.wav"), 1.0f, 80, 0.15f);
            GenerateWav(Path.Combine(Application.dataPath, "_Project", "Audio", "Ambience", "temple_bell.wav"), 0.5f, 520, 0.3f);
            GenerateWav(Path.Combine(Application.dataPath, "_Project", "Audio", "Ambience", "birds.wav"), 0.5f, 2000, 0.08f);
            GenerateWav(Path.Combine(Application.dataPath, "_Project", "Audio", "Footsteps", "footstep_stone.wav"), 0.2f, 300, 0.3f);
            GenerateWav(Path.Combine(Application.dataPath, "_Project", "Audio", "Interactions", "stone_click.wav"), 0.2f, 800, 0.5f);
            GenerateWav(Path.Combine(Application.dataPath, "_Project", "Audio", "Interactions", "wrong_answer.wav"), 0.3f, 150, 0.3f);
            GenerateWav(Path.Combine(Application.dataPath, "_Project", "Audio", "Interactions", "puzzle_success.wav"), 0.5f, 440, 0.4f);
            GenerateWav(Path.Combine(Application.dataPath, "_Project", "Audio", "Interactions", "door_open.wav"), 0.5f, 60, 0.35f);
            GenerateWav(Path.Combine(Application.dataPath, "_Project", "Audio", "UI", "ui_click.wav"), 0.1f, 1200, 0.25f);
            GenerateWav(Path.Combine(Application.dataPath, "_Project", "Audio", "UI", "ui_hover.wav"), 0.08f, 800, 0.15f);

            AssetDatabase.Refresh();
            Debug.Log("[GenerateAudioAssets] Generated 10 procedural audio files.");
        }

        private static void GenerateWav(string path, float duration, int frequency, float volume)
        {
            int sampleRate = 22050;
            int numSamples = (int)(duration * sampleRate);
            int dataSize = numSamples * 2; // 16-bit mono
            int fileSize = 36 + dataSize;

            byte[] buffer = new byte[44 + dataSize];
            int offset = 0;

            // RIFF header
            buffer[offset++] = (byte)'R'; buffer[offset++] = (byte)'I';
            buffer[offset++] = (byte)'F'; buffer[offset++] = (byte)'F';
            WriteInt32(buffer, ref offset, fileSize);
            buffer[offset++] = (byte)'W'; buffer[offset++] = (byte)'A';
            buffer[offset++] = (byte)'V'; buffer[offset++] = (byte)'E';

            // fmt chunk
            buffer[offset++] = (byte)'f'; buffer[offset++] = (byte)'m';
            buffer[offset++] = (byte)'t'; buffer[offset++] = (byte)' ';
            WriteInt32(buffer, ref offset, 16);
            WriteInt16(buffer, ref offset, 1); // PCM
            WriteInt16(buffer, ref offset, 1); // Mono
            WriteInt32(buffer, ref offset, sampleRate);
            WriteInt32(buffer, ref offset, sampleRate * 2); // Byte rate
            WriteInt16(buffer, ref offset, 2); // Block align
            WriteInt16(buffer, ref offset, 16); // Bits per sample

            // data chunk
            buffer[offset++] = (byte)'d'; buffer[offset++] = (byte)'a';
            buffer[offset++] = (byte)'t'; buffer[offset++] = (byte)'a';
            WriteInt32(buffer, ref offset, dataSize);

            // Generate samples
            for (int i = 0; i < numSamples; i++)
            {
                float t = (float)i / sampleRate;
                float envelope = 1.0f;
                if (t < 0.01f) envelope = t / 0.01f;
                else if (t > duration - 0.01f) envelope = (duration - t) / 0.01f;

                float sample = Mathf.Sin(2f * Mathf.PI * frequency * t) * volume * envelope;
                short value = (short)(sample * 32767f);
                buffer[offset++] = (byte)value;
                buffer[offset++] = (byte)(value >> 8);
            }

            Directory.CreateDirectory(Path.GetDirectoryName(path));
            File.WriteAllBytes(path, buffer);
        }

        private static void WriteInt16(byte[] buffer, ref int offset, short value)
        {
            buffer[offset++] = (byte)value;
            buffer[offset++] = (byte)(value >> 8);
        }

        private static void WriteInt32(byte[] buffer, ref int offset, int value)
        {
            buffer[offset++] = (byte)value;
            buffer[offset++] = (byte)(value >> 8);
            buffer[offset++] = (byte)(value >> 16);
            buffer[offset++] = (byte)(value >> 24);
        }
    }
}
