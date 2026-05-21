package data.utils;

import java.math.BigInteger;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;

public class API {
    public static  String getName (String fullname){
        String s="";
        for(int i = fullname.length()-1;i>=0;i--){
            if (fullname.charAt(i)==' ') break;
            s = fullname.charAt(i)+ s;
        }
        return s;
    }
    public static String getMd5(String input) {
    try {

        // Static getInstance method is called with hashing MD5
        MessageDigest md = MessageDigest.getInstance("MD5");

        // digest() method is called to calculate message digest
        // of an input digest() return array of byte
        byte[] messageDigest = md.digest(input.getBytes());

        // Convert byte array into signum representation
        BigInteger no = new BigInteger(1, messageDigest);

        // Convert message digest into hex value
        String hashtext = no.toString(16);
        while (hashtext.length() < 32) {
            hashtext = "0" + hashtext;
        }
        return hashtext;
    }
    // For specifying wrong message digest algorithms
    catch (NoSuchAlgorithmException e) {
        throw new RuntimeException(e);
    }
}
}

